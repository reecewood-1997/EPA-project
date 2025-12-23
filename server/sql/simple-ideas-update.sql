-- Simple update to add missing columns

-- Add missing columns to Ideas table one by one
ALTER TABLE Ideas ADD ExpectedImpact NVARCHAR(1000);
ALTER TABLE Ideas ADD RequiredResources NVARCHAR(1000);
ALTER TABLE Ideas ADD EstimatedCost DECIMAL(10,2);
ALTER TABLE Ideas ADD EstimatedParticipants INT;
ALTER TABLE Ideas ADD AdminNotes NVARCHAR(1000);
ALTER TABLE Ideas ADD ImplementationDate DATETIME2 NULL;
ALTER TABLE Ideas ADD IsActive BIT DEFAULT 1;

-- Rename ProposedBy to CreatedBy for consistency
EXEC sp_rename 'Ideas.ProposedBy', 'CreatedBy', 'COLUMN';

-- Add missing columns to IdeaCategories
ALTER TABLE IdeaCategories ADD Color NVARCHAR(7) DEFAULT '#1976d2';
ALTER TABLE IdeaCategories ADD IsActive BIT DEFAULT 1;
ALTER TABLE IdeaCategories ADD CreatedAt DATETIME2 DEFAULT GETUTCDATE();
ALTER TABLE IdeaCategories ADD UpdatedAt DATETIME2 DEFAULT GETUTCDATE();

-- Insert idea categories
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