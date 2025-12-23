-- PwC One Firm One Day - Ideas & Voting System Database Schema

-- Ideas Categories Table
CREATE TABLE IdeaCategories (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(100) NOT NULL UNIQUE,
    Description NVARCHAR(500),
    Color NVARCHAR(7) DEFAULT '#1976d2', -- Hex color code
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
);

-- Ideas Table
CREATE TABLE Ideas (
    IdeaID INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    ExpectedImpact NVARCHAR(1000), -- What impact this idea will have
    RequiredResources NVARCHAR(1000), -- Resources needed to implement
    EstimatedCost DECIMAL(10,2), -- Estimated cost in GBP
    EstimatedParticipants INT, -- Expected number of volunteers
    CategoryID INT NOT NULL,
    CreatedBy INT NOT NULL,
    Status NVARCHAR(50) DEFAULT 'submitted', -- submitted, under_review, approved, rejected, implemented
    AdminNotes NVARCHAR(1000), -- Admin feedback/notes
    ImplementationDate DATETIME2 NULL, -- When idea will be/was implemented
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (CategoryID) REFERENCES IdeaCategories(CategoryID),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
);

-- Idea Votes Table
CREATE TABLE IdeaVotes (
    VoteID INT IDENTITY(1,1) PRIMARY KEY,
    IdeaID INT NOT NULL,
    UserID INT NOT NULL,
    VoteType NVARCHAR(10) NOT NULL CHECK (VoteType IN ('upvote', 'downvote')),
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (IdeaID) REFERENCES Ideas(IdeaID) ON DELETE CASCADE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    
    -- Ensure one vote per user per idea
    UNIQUE(IdeaID, UserID)
);

-- Idea Comments Table (for feedback/discussion)
CREATE TABLE IdeaComments (
    CommentID INT IDENTITY(1,1) PRIMARY KEY,
    IdeaID INT NOT NULL,
    UserID INT NOT NULL,
    Comment NVARCHAR(1000) NOT NULL,
    IsAdminComment BIT DEFAULT 0, -- Distinguish admin feedback
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
    
    FOREIGN KEY (IdeaID) REFERENCES Ideas(IdeaID) ON DELETE CASCADE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

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

-- Create indexes for performance
CREATE INDEX IX_Ideas_Status ON Ideas(Status);
CREATE INDEX IX_Ideas_CreatedBy ON Ideas(CreatedBy);
CREATE INDEX IX_Ideas_Category ON Ideas(CategoryID);
CREATE INDEX IX_IdeaVotes_Idea ON IdeaVotes(IdeaID);
CREATE INDEX IX_IdeaVotes_User ON IdeaVotes(UserID);
CREATE INDEX IX_IdeaComments_Idea ON IdeaComments(IdeaID);

GO

-- Create view for idea statistics
CREATE VIEW vw_IdeaStats AS
SELECT 
    i.IdeaID,
    i.Title,
    i.Status,
    ic.CategoryName,
    u.FirstName + ' ' + u.LastName as SubmittedBy,
    i.CreatedAt,
    COALESCE(upvotes.UpvoteCount, 0) as UpvoteCount,
    COALESCE(downvotes.DownvoteCount, 0) as DownvoteCount,
    COALESCE(upvotes.UpvoteCount, 0) - COALESCE(downvotes.DownvoteCount, 0) as NetVotes,
    COALESCE(comments.CommentCount, 0) as CommentCount
FROM Ideas i
LEFT JOIN IdeaCategories ic ON i.CategoryID = ic.CategoryID
LEFT JOIN Users u ON i.CreatedBy = u.UserID
LEFT JOIN (
    SELECT IdeaID, COUNT(*) as UpvoteCount 
    FROM IdeaVotes 
    WHERE VoteType = 'upvote' 
    GROUP BY IdeaID
) upvotes ON i.IdeaID = upvotes.IdeaID
LEFT JOIN (
    SELECT IdeaID, COUNT(*) as DownvoteCount 
    FROM IdeaVotes 
    WHERE VoteType = 'downvote' 
    GROUP BY IdeaID
) downvotes ON i.IdeaID = downvotes.IdeaID
LEFT JOIN (
    SELECT IdeaID, COUNT(*) as CommentCount 
    FROM IdeaComments 
    GROUP BY IdeaID
) comments ON i.IdeaID = comments.IdeaID
WHERE i.IsActive = 1;