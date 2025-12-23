-- Add missing columns to IdeaComments table

-- Check if IsAdminComment column exists, if not add it
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'IdeaComments' AND COLUMN_NAME = 'IsAdminComment'
)
BEGIN
    ALTER TABLE IdeaComments
    ADD IsAdminComment BIT DEFAULT 0;

    PRINT 'Added IsAdminComment column to IdeaComments table';
END
ELSE
BEGIN
    PRINT 'IsAdminComment column already exists';
END

GO

-- Check if UpdatedAt column exists, if not add it
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'IdeaComments' AND COLUMN_NAME = 'UpdatedAt'
)
BEGIN
    ALTER TABLE IdeaComments
    ADD UpdatedAt DATETIME2 DEFAULT GETUTCDATE();

    PRINT 'Added UpdatedAt column to IdeaComments table';
END
ELSE
BEGIN
    PRINT 'UpdatedAt column already exists';
END

GO

PRINT 'IdeaComments table update complete';
