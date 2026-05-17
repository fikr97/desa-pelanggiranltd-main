import React from 'react';
import Layout from '@/components/Layout';
import DocumentUpload from './DocumentUpload';
import VerifikasiPage from './VerifikasiPage';

export const DocumentUploadPage = () => (
  <Layout>
    <DocumentUpload />
  </Layout>
);

export const DokumenTanahVerifikasiPage = () => (
  <Layout>
    <VerifikasiPage />
  </Layout>
);

export default DocumentUploadPage;
