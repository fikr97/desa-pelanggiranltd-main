
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Import libraries untuk memproses berbagai format dokumen
import PizZip from 'https://esm.sh/pizzip@3.1.4'
import Docxtemplater from 'https://esm.sh/docxtemplater@3.44.0'
// Import library untuk RTF processing
// Note: RTF processing menggunakan text-based replacement

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { template_url, merge_data, template_id, file_format } = await req.json()

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting DOCX generation process...')
    console.log('Template URL:', template_url)
    console.log('Merge data:', merge_data)

    // Download template file
    const templateResponse = await fetch(template_url)
    if (!templateResponse.ok) {
      throw new Error(`Failed to download template: ${templateResponse.statusText}`)
    }
    
    const templateBuffer = await templateResponse.arrayBuffer()
    console.log('Template downloaded, size:', templateBuffer.byteLength)

    // Detect file format from URL or provided format
    const detectedFormat = file_format || detectFileFormat(template_url)
    console.log('Detected file format:', detectedFormat)

    // Process template based on format
    let processedBuffer: Uint8Array
    let fileName: string
    let contentType: string

    if (detectedFormat === 'docx') {
      processedBuffer = await processDocxTemplate(templateBuffer, merge_data)
      fileName = `surat_${template_id}_${Date.now()}.docx`
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    } else if (detectedFormat === 'doc') {
      // DOC files are treated as binary but we'll do basic text replacement
      processedBuffer = await processDocTemplate(templateBuffer, merge_data)
      fileName = `surat_${template_id}_${Date.now()}.doc`
      contentType = 'application/msword'
    } else if (detectedFormat === 'rtf') {
      // RTF files are text-based and easier to process
      processedBuffer = await processRtfTemplate(templateBuffer, merge_data)
      fileName = `surat_${template_id}_${Date.now()}.rtf`
      contentType = 'application/rtf'
    } else {
      throw new Error(`Unsupported file format: ${detectedFormat}. Supported formats: DOCX, DOC, RTF`)
    }

    // Upload processed file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('surat-docx')
      .upload(`generated/${fileName}`, processedBuffer, {
        contentType: contentType
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw uploadError
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('surat-docx')
      .getPublicUrl(`generated/${fileName}`)

    console.log('File uploaded successfully:', publicUrl)

    return new Response(
      JSON.stringify({ 
        success: true,
        file_url: publicUrl,
        filename: fileName
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('Error in generate-surat function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        }
      }
    )
  }
})

// Function to detect file format from URL
function detectFileFormat(url: string): string {
  const urlLower = url.toLowerCase()
  if (urlLower.includes('.docx')) return 'docx'
  if (urlLower.includes('.doc')) return 'doc'
  if (urlLower.includes('.rtf')) return 'rtf'
  
  // Default to docx if cannot detect
  return 'docx'
}

// Fungsi untuk memproses DOCX template dengan Docxtemplater
async function processDocxTemplate(templateBuffer: ArrayBuffer, mergeData: any): Promise<Uint8Array> {
  console.log('Processing DOCX template with merge data...')
  
  try {
    // Load DOCX template dengan PizZip
    const zip = new PizZip(templateBuffer)
    
    // Create Docxtemplater instance
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: {
        start: '{',
        end: '}'
      }
    })

    // Clean merge data - remove problematic characters and ensure proper format
    const cleanedData = cleanMergeData(mergeData)

    console.log('Cleaned merge data:', JSON.stringify(cleanedData, null, 2))

    // Set template data dengan cleaned mergeData
    doc.setData(cleanedData)

    try {
      // Render template dengan data
      doc.render()
    } catch (error) {
      console.error('Error rendering template:', error)
      
      // Log detailed error information for debugging
      if (error.properties) {
        console.error('Template error details:', JSON.stringify(error.properties, null, 2))
        
        // Check for specific unopened tag errors
        if (error.properties.errors) {
          const unopenedTags = error.properties.errors
            .filter((err: any) => err.properties?.id === 'unopened_tag')
            .map((err: any) => err.properties?.xtag)
            .filter((tag: any) => tag)
          
          if (unopenedTags.length > 0) {
            throw new Error(`Template memiliki placeholder yang tidak valid: ${unopenedTags.join(', ')}. Pastikan semua placeholder menggunakan format {nama_field} dengan kurung kurawal yang lengkap.`)
          }
        }
      }
      
      // Try to extract more information about the error
      const errorMessage = error.message || 'Unknown template error'
      throw new Error(`Template rendering failed: ${errorMessage}`)
    }

    // Generate output buffer
    const outputBuffer = doc.getZip().generate({
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6
      }
    })

    console.log('Template processing completed successfully')
    return outputBuffer
    
  } catch (error) {
    console.error('Error processing DOCX template:', error)
    
    // Provide more specific error information
    if (error.name === 'TemplateError') {
      throw new Error(`DOCX template error: ${error.message}. Please check your template format and placeholders.`)
    }
    
    throw new Error(`DOCX processing failed: ${error.message}`)
  }
}

// Function to convert number to Indonesian text
function convertToIndonesianText(number: number): string {
  const ones = [
    '', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan',
    'sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas', 'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'
  ];
  
  const tens = ['', '', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh', 'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh'];
  
  if (number === 0) return 'nol';
  if (number < 20) return ones[number];
  if (number < 100) return tens[Math.floor(number / 10)] + (number % 10 !== 0 ? ' ' + ones[number % 10] : '');
  if (number < 1000) {
    if (Math.floor(number / 100) === 1) {
      return 'seratus' + (number % 100 !== 0 ? ' ' + convertToIndonesianText(number % 100) : '');
    } else {
      return ones[Math.floor(number / 100)] + ' ratus' + (number % 100 !== 0 ? ' ' + convertToIndonesianText(number % 100) : '');
    }
  }
  if (number < 1000000) {
    if (Math.floor(number / 1000) === 1) {
      return 'seribu' + (number % 1000 !== 0 ? ' ' + convertToIndonesianText(number % 1000) : '');
    } else {
      return convertToIndonesianText(Math.floor(number / 1000)) + ' ribu' + (number % 1000 !== 0 ? ' ' + convertToIndonesianText(number % 1000) : '');
    }
  }
  if (number < 1000000000) {
    return convertToIndonesianText(Math.floor(number / 1000000)) + ' juta' + (number % 1000000 !== 0 ? ' ' + convertToIndonesianText(number % 1000000) : '');
  }
  
  return convertToIndonesianText(Math.floor(number / 1000000000)) + ' miliar' + (number % 1000000000 !== 0 ? ' ' + convertToIndonesianText(number % 1000000000) : '');
}

// Function to convert number to Indonesian rupiah text
function convertToRupiahText(amount: number): string {
  if (amount === 0) return 'nol rupiah';
  
  const numberText = convertToIndonesianText(Math.floor(amount));
  return numberText + ' rupiah';
}

// Function to process DOC template (legacy Word format)
async function processDocTemplate(templateBuffer: ArrayBuffer, mergeData: any): Promise<Uint8Array> {
  console.log('Processing DOC template with text replacement...')
  
  try {
    // Convert binary to text (this is a simplified approach)
    const decoder = new TextDecoder('utf-8', { fatal: false })
    let content = decoder.decode(templateBuffer)
    
    // Clean and process merge data
    const cleanedData = cleanMergeData(mergeData)
    
    // Replace placeholders in the content
    for (const [key, value] of Object.entries(cleanedData)) {
      const placeholder = `{${key}}`
      const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
      content = content.replace(regex, String(value || ''))
    }
    
    console.log('DOC template processing completed')
    return new TextEncoder().encode(content)
    
  } catch (error) {
    console.error('Error processing DOC template:', error)
    throw new Error(`DOC processing failed: ${error.message}`)
  }
}

// Function to process RTF template
async function processRtfTemplate(templateBuffer: ArrayBuffer, mergeData: any): Promise<Uint8Array> {
  console.log('Processing RTF template with text replacement...')
  
  try {
    // RTF is text-based, so we can decode it directly
    const decoder = new TextDecoder('utf-8')
    let content = decoder.decode(templateBuffer)
    
    // Clean and process merge data
    const cleanedData = cleanMergeData(mergeData)
    
    // Replace placeholders in the RTF content
    for (const [key, value] of Object.entries(cleanedData)) {
      const placeholder = `{${key}}`
      const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
      content = content.replace(regex, String(value || ''))
    }
    
    console.log('RTF template processing completed')
    return new TextEncoder().encode(content)
    
  } catch (error) {
    console.error('Error processing RTF template:', error)
    throw new Error(`RTF processing failed: ${error.message}`)
  }
}

// Helper function to clean merge data (extracted for reuse)
function cleanMergeData(mergeData: any): { [key: string]: string } {
  const cleanedData: { [key: string]: string } = {}
  
  // First pass: Set all basic key-value pairs
  for (const [key, value] of Object.entries(mergeData)) {
    // Clean field names - remove special characters that might cause issues
    const cleanKey = key.replace(/[^\w\s-]/g, '_').replace(/\s+/g, '_')
    cleanedData[cleanKey] = typeof value === 'string' ? value : String(value || '')
    
    // Also add the original key with slashes replaced by underscores for backward compatibility
    if (key.includes('/')) {
      const slashKey = key.replace(/\//g, '_')
      cleanedData[slashKey] = typeof value === 'string' ? value : String(value || '')
    }
    
    // Handle number conversion fields
    if (key.includes('angka_rupiah') && value) {
      try {
        const amount = parseFloat(value.toString());
        if (!isNaN(amount)) {
          cleanedData[key] = convertToRupiahText(amount);
        }
      } catch (error) {
        console.error('Error converting rupiah text:', error);
      }
    } else if (key.includes('angka_biasa') && value) {
      try {
        const number = parseInt(value.toString());
        if (!isNaN(number)) {
          cleanedData[key] = convertToIndonesianText(number);
        }
      } catch (error) {
        console.error('Error converting number text:', error);
      }
    }
  }
  
  // Second pass: Handle special mappings without overriding existing values
  for (const [key, value] of Object.entries(mergeData)) {
    // Special handling for common template placeholders
    if (key === 'nama_desa_kel' || key === 'nama_desa/kel') {
      cleanedData['nama_desa_kel'] = typeof value === 'string' ? value : String(value || '')
      // Only set if they don't already exist
      if (!cleanedData['nama_desa']) {
        cleanedData['nama_desa'] = typeof value === 'string' ? value : String(value || '')
      }
      if (!cleanedData['nama_kel']) {
        cleanedData['nama_kel'] = typeof value === 'string' ? value : String(value || '')
      }
    }
    
    if (key === 'nama_kab_kota' || key === 'nama_kab/kota') {
      cleanedData['nama_kab_kota'] = typeof value === 'string' ? value : String(value || '')
      // Only set if they don't already exist
      if (!cleanedData['nama_kab']) {
        cleanedData['nama_kab'] = typeof value === 'string' ? value : String(value || '')
      }
      if (!cleanedData['nama_kota']) {
        cleanedData['nama_kota'] = typeof value === 'string' ? value : String(value || '')
      }
    }
    
    if (key === 'sebutan_desa_kel' || key === 'sebutan_desa/kel') {
      cleanedData['sebutan_desa_kel'] = typeof value === 'string' ? value : String(value || '')
      // Only set if they don't already exist
      if (!cleanedData['sebutan_desa']) {
        cleanedData['sebutan_desa'] = typeof value === 'string' ? value : String(value || '')
      }
      if (!cleanedData['sebutan_kel']) {
        cleanedData['sebutan_kel'] = typeof value === 'string' ? value : String(value || '')
      }
    }
    
    if (key === 'sebutan_kab_kota' || key === 'sebutan_kab/kota') {
      cleanedData['sebutan_kab_kota'] = typeof value === 'string' ? value : String(value || '')
      // Only set if they don't already exist  
      if (!cleanedData['sebutan_kab']) {
        cleanedData['sebutan_kab'] = typeof value === 'string' ? value : String(value || '')
      }
      if (!cleanedData['sebutan_kota']) {
        cleanedData['sebutan_kota'] = typeof value === 'string' ? value : String(value || '')
      }
    }
  }
  
  // Set default values for sebutan fields if not provided
  cleanedData['sebutan_desa'] = cleanedData['sebutan_desa'] || 'Desa'
  cleanedData['sebutan_kabupaten'] = cleanedData['sebutan_kabupaten'] || 'Kabupaten'
  
  console.log('Final sebutan values:', {
    sebutan_desa: cleanedData['sebutan_desa'],
    sebutan_kabupaten: cleanedData['sebutan_kabupaten']
  })

  // Add current year for the {tahun} placeholder
  cleanedData['tahun'] = new Date().getFullYear().toString()
  
  return cleanedData
}
