CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE public.downloads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_url text NOT NULL,
    platform character varying(32) NOT NULL,
    status character varying(16) DEFAULT 'processing'::character varying NOT NULL,
    format character varying(8) DEFAULT 'mp4'::character varying NOT NULL,
    quality character varying(180),
    title text,
    author text,
    thumbnail_url text,
    duration_seconds integer,
    remote_url text,
    remote_headers jsonb,
    file_name text,
    file_size_bytes bigint,
    mime_type character varying(80),
    engine character varying(24),
    is_sample boolean DEFAULT false NOT NULL,
    download_count integer DEFAULT 0 NOT NULL,
    error_code character varying(40),
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    note text
);



ALTER TABLE ONLY public.downloads
    ADD CONSTRAINT downloads_pkey PRIMARY KEY (id);



CREATE INDEX downloads_created_at_idx ON public.downloads USING btree (created_at);
