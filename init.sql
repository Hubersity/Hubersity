DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'post_images'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'post_images' AND column_name = 'file_type'
        ) THEN
            ALTER TABLE post_images ADD COLUMN file_type VARCHAR;
        END IF;
    END IF;
END $$;