-- Event Feedback System Database Schema

-- EventFeedback Table
CREATE TABLE EventFeedback (
    FeedbackID INT IDENTITY(1,1) PRIMARY KEY,
    EventID INT NOT NULL,
    UserID INT NOT NULL,
    Rating INT NOT NULL CHECK (Rating >= 1 AND Rating <= 5), -- 1-5 star rating
    Comment NVARCHAR(1000) NULL,
    WouldRecommend BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),

    FOREIGN KEY (EventID) REFERENCES Events(EventID) ON DELETE CASCADE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,

    -- Ensure a user can only submit one feedback per event
    CONSTRAINT UQ_UserEvent_Feedback UNIQUE (EventID, UserID)
);

-- Create indexes for performance
CREATE INDEX IX_EventFeedback_Event ON EventFeedback(EventID);
CREATE INDEX IX_EventFeedback_User ON EventFeedback(UserID);
CREATE INDEX IX_EventFeedback_Rating ON EventFeedback(Rating);
CREATE INDEX IX_EventFeedback_CreatedAt ON EventFeedback(CreatedAt DESC);

GO

PRINT 'EventFeedback table created successfully';
