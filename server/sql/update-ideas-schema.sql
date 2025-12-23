-- Update existing Ideas table with missing columns
ALTER TABLE Ideas 
ADD ExpectedImpact NVARCHAR(1000),
    RequiredResources NVARCHAR(1000),
    EstimatedCost DECIMAL(10,2),
    EstimatedParticipants INT,
    AdminNotes NVARCHAR(1000),
    ImplementationDate DATETIME2 NULL,
    IsActive BIT DEFAULT 1;

-- Add CreatedBy column if it doesn't exist (rename ProposedBy)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Ideas' AND COLUMN_NAME = 'CreatedBy')
BEGIN
    EXEC sp_rename 'Ideas.ProposedBy', 'CreatedBy', 'COLUMN'
END

-- Update IdeaCategories table structure if needed
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'IdeaCategories' AND COLUMN_NAME = 'Color')
BEGIN
    ALTER TABLE IdeaCategories 
    ADD Color NVARCHAR(7) DEFAULT '#1976d2',
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 DEFAULT GETUTCDATE();
END

-- Insert default idea categories
INSERT INTO IdeaCategories (CategoryName, Description, Color) VALUES
('Environmental', 'Ideas focused on environmental sustainability and conservation', '#4caf50'),
('Education', 'Educational outreach and skills development initiatives', '#2196f3'),
('Community Support', 'Supporting local communities and vulnerable groups', '#ff9800'),
('Health & Wellbeing', 'Mental health, physical wellbeing, and healthcare support', '#e91e63'),
('Technology for Good', 'Using technology to solve social problems', '#9c27b0'),
('Digital Inclusion', 'Bridging the digital divide and promoting digital literacy', '#00bcd4'),
('Youth Development', 'Programs focused on supporting young people', '#8bc34a'),
('Elderly Care', 'Supporting elderly members of our communities', '#795548'),
('Disaster Relief', 'Emergency response and disaster recovery efforts', '#f44336'),
('Skills-based Volunteering', 'Using professional skills for social impact', '#607d8b');

-- Set default value for IsActive on existing records
UPDATE Ideas SET IsActive = 1;