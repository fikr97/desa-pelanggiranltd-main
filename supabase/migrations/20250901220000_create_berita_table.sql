CREATE TABLE public.berita (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    judul text NOT NULL,
    slug text NOT NULL,
    isi text NOT NULL,
    gambar text,
    tanggal_publikasi timestamp with time zone NOT NULL DEFAULT now(),
    status text NOT NULL DEFAULT 'draft',
    CONSTRAINT berita_pkey PRIMARY KEY (id),
    CONSTRAINT berita_slug_key UNIQUE (slug)
);
