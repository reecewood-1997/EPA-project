-- Add Bio and Interests fields to Users table for profile customization

-- Check if Bio column exists, if not add it
IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('Users')
    AND name = 'Bio'
)
BEGIN
    ALTER TABLE Users
    ADD Bio NVARCHAR(500) NULL;
    PRINT 'Bio column added successfully';
END
ELSE
BEGIN
    PRINT 'Bio column already exists';
END

GO

-- Check if Interests column exists, if not add it
IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('Users')
    AND name = 'Interests'
)
BEGIN
    ALTER TABLE Users
    ADD Interests NVARCHAR(500) NULL;
    PRINT 'Interests column added successfully';
END
ELSE
BEGIN
    PRINT 'Interests column already exists';
END

GO

PRINT 'User profile fields migration completed';
