-- PwC Volunteer Platform Database Setup
-- Run this script in SSMS to create the database and tables

-- Create Database
CREATE DATABASE PwCVolunteerPlatform;
GO

USE PwCVolunteerPlatform;
GO

-- Users Table
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(255) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    Role NVARCHAR(20) CHECK (Role IN ('employee', 'manager', 'admin')) DEFAULT 'employee',
    Department NVARCHAR(100),
    Location NVARCHAR(100),
    ProfilePicture NVARCHAR(500),
    Bio NTEXT,
    Interests NVARCHAR(MAX), -- JSON array of interests
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
    IsActive BIT DEFAULT 1
);
GO

-- Event Categories Table
CREATE TABLE EventCategories (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(100) NOT NULL UNIQUE,
    Description NTEXT,
    Color NVARCHAR(7), -- Hex color code
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);
GO

-- Events Table
CREATE TABLE Events (
    EventID INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(200) NOT NULL,
    Description NTEXT,
    Location NVARCHAR(500),
    StartDateTime DATETIME2 NOT NULL,
    EndDateTime DATETIME2 NOT NULL,
    MaxParticipants INT,
    RequiredSkills NVARCHAR(MAX), -- JSON array of skills
    CategoryID INT FOREIGN KEY REFERENCES EventCategories(CategoryID),
    CreatedBy INT FOREIGN KEY REFERENCES Users(UserID),
    Status NVARCHAR(20) CHECK (Status IN ('draft', 'published', 'cancelled', 'completed')) DEFAULT 'draft',
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
);
GO

-- Event Participants Table
CREATE TABLE EventParticipants (
    ParticipantID INT IDENTITY(1,1) PRIMARY KEY,
    EventID INT FOREIGN KEY REFERENCES Events(EventID),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    Status NVARCHAR(20) CHECK (Status IN ('registered', 'confirmed', 'attended', 'cancelled')) DEFAULT 'registered',
    RegistrationDate DATETIME2 DEFAULT GETUTCDATE(),
    UNIQUE(EventID, UserID)
);
GO

-- Ideas Table (for volunteer idea proposals)
CREATE TABLE Ideas (
    IdeaID INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(200) NOT NULL,
    Description NTEXT NOT NULL,
    ProposedBy INT FOREIGN KEY REFERENCES Users(UserID),
    CategoryID INT FOREIGN KEY REFERENCES EventCategories(CategoryID),
    Status NVARCHAR(20) CHECK (Status IN ('submitted', 'under_review', 'approved', 'rejected', 'implemented')) DEFAULT 'submitted',
    VoteCount INT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
);
GO

-- Idea Votes Table
CREATE TABLE IdeaVotes (
    VoteID INT IDENTITY(1,1) PRIMARY KEY,
    IdeaID INT FOREIGN KEY REFERENCES Ideas(IdeaID),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    VoteType NVARCHAR(10) CHECK (VoteType IN ('upvote', 'downvote')) NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UNIQUE(IdeaID, UserID)
);
GO

-- Idea Comments Table
CREATE TABLE IdeaComments (
    CommentID INT IDENTITY(1,1) PRIMARY KEY,
    IdeaID INT FOREIGN KEY REFERENCES Ideas(IdeaID),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    Comment NTEXT NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);
GO

-- Event Feedback Table
CREATE TABLE EventFeedback (
    FeedbackID INT IDENTITY(1,1) PRIMARY KEY,
    EventID INT FOREIGN KEY REFERENCES Events(EventID),
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    Rating INT CHECK (Rating >= 1 AND Rating <= 5),
    Comments NTEXT,
    Recommendations NTEXT,
    WouldRecommend BIT,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UNIQUE(EventID, UserID)
);
GO

-- Messages Table (for in-platform messaging)
CREATE TABLE Messages (
    MessageID INT IDENTITY(1,1) PRIMARY KEY,
    SenderID INT FOREIGN KEY REFERENCES Users(UserID),
    RecipientID INT FOREIGN KEY REFERENCES Users(UserID),
    Subject NVARCHAR(200),
    Body NTEXT NOT NULL,
    MessageType NVARCHAR(20) CHECK (MessageType IN ('invitation', 'reminder', 'general')) DEFAULT 'general',
    RelatedEventID INT FOREIGN KEY REFERENCES Events(EventID),
    IsRead BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);
GO

-- Event Tags Table (for better categorization)
CREATE TABLE EventTags (
    TagID INT IDENTITY(1,1) PRIMARY KEY,
    TagName NVARCHAR(50) NOT NULL UNIQUE,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE()
);
GO

-- Event Tag Mappings
CREATE TABLE EventTagMappings (
    EventID INT FOREIGN KEY REFERENCES Events(EventID),
    TagID INT FOREIGN KEY REFERENCES EventTags(TagID),
    PRIMARY KEY (EventID, TagID)
);
GO

-- User Preferences Table
CREATE TABLE UserPreferences (
    UserID INT FOREIGN KEY REFERENCES Users(UserID) PRIMARY KEY,
    PreferredCategories NVARCHAR(MAX), -- JSON array of category IDs
    EmailNotifications BIT DEFAULT 1,
    SMSNotifications BIT DEFAULT 0,
    WeeklyDigest BIT DEFAULT 1,
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
);
GO

-- Insert Default Categories
INSERT INTO EventCategories (CategoryName, Description, Color) VALUES
('Environment', 'Environmental conservation and sustainability projects', '#4CAF50'),
('Education', 'Educational support and mentoring programs', '#2196F3'),
('Health', 'Health and wellness community initiatives', '#FF5722'),
('Community', 'General community service and support', '#9C27B0'),
('Technology', 'Digital inclusion and tech education', '#FF9800'),
('Arts & Culture', 'Cultural preservation and arts programs', '#E91E63');
GO

-- Insert Default Tags
INSERT INTO EventTags (TagName) VALUES
('Outdoor'), ('Indoor'), ('Remote'), ('Weekend'), ('Weekday'),
('Family-friendly'), ('Skills-based'), ('Physical'), ('Mental Health'),
('Senior Citizens'), ('Children', 'Youth'), ('Disability Support');
GO

-- Create Indexes for Performance
CREATE INDEX IX_Events_StartDateTime ON Events(StartDateTime);
CREATE INDEX IX_Events_Category ON Events(CategoryID);
CREATE INDEX IX_Events_CreatedBy ON Events(CreatedBy);
CREATE INDEX IX_EventParticipants_Event ON EventParticipants(EventID);
CREATE INDEX IX_EventParticipants_User ON EventParticipants(UserID);
CREATE INDEX IX_Ideas_Status ON Ideas(Status);
CREATE INDEX IX_Messages_Recipient ON Messages(RecipientID);
CREATE INDEX IX_Messages_Sender ON Messages(SenderID);
GO

-- Create Update Trigger for UpdatedAt columns
CREATE TRIGGER tr_Users_UpdatedAt ON Users
AFTER UPDATE AS
BEGIN
    UPDATE Users 
    SET UpdatedAt = GETUTCDATE()
    FROM Users u
    INNER JOIN inserted i ON u.UserID = i.UserID;
END;
GO

CREATE TRIGGER tr_Events_UpdatedAt ON Events
AFTER UPDATE AS
BEGIN
    UPDATE Events 
    SET UpdatedAt = GETUTCDATE()
    FROM Events e
    INNER JOIN inserted i ON e.EventID = i.EventID;
END;
GO

CREATE TRIGGER tr_Ideas_UpdatedAt ON Ideas
AFTER UPDATE AS
BEGIN
    UPDATE Ideas 
    SET UpdatedAt = GETUTCDATE()
    FROM Ideas id
    INNER JOIN inserted i ON id.IdeaID = i.IdeaID;
END;
GO

PRINT 'Database setup completed successfully!';