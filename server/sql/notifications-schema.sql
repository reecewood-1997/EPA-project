-- Notifications System Database Schema
-- Supports in-platform messaging, event reminders, and colleague invitations

-- Notifications Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
BEGIN
    CREATE TABLE Notifications (
        NotificationID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL,
        Type NVARCHAR(50) NOT NULL, -- event_registered, event_cancelled, event_updated, event_invitation, event_reminder, idea_approved, idea_rejected, idea_comment, comment_reply
        Title NVARCHAR(200) NOT NULL,
        Message NVARCHAR(1000) NOT NULL,
        RelatedEntityType NVARCHAR(50) NULL, -- event, idea, comment, invitation
        RelatedEntityID INT NULL,
        ActionURL NVARCHAR(500) NULL, -- Link to relevant page
        IsRead BIT DEFAULT 0,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        ReadAt DATETIME2 NULL,

        FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
    );

    -- Create indexes for performance
    CREATE INDEX IX_Notifications_User ON Notifications(UserID);
    CREATE INDEX IX_Notifications_IsRead ON Notifications(IsRead);
    CREATE INDEX IX_Notifications_CreatedAt ON Notifications(CreatedAt DESC);
    CREATE INDEX IX_Notifications_User_IsRead ON Notifications(UserID, IsRead);
    CREATE INDEX IX_Notifications_Type ON Notifications(Type);

    PRINT 'Notifications table created successfully';
END
ELSE
BEGIN
    PRINT 'Notifications table already exists';
END

GO

-- EventInvitations Table for colleague invitations
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EventInvitations')
BEGIN
    CREATE TABLE EventInvitations (
        InvitationID INT IDENTITY(1,1) PRIMARY KEY,
        EventID INT NOT NULL,
        InviterUserID INT NOT NULL, -- Who sent the invitation
        InviteeUserID INT NOT NULL, -- Who received the invitation
        Status NVARCHAR(20) DEFAULT 'Pending', -- 'Pending', 'Accepted', 'Declined'
        Message NVARCHAR(500) NULL, -- Optional personal message from inviter
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        RespondedAt DATETIME2 NULL,

        FOREIGN KEY (EventID) REFERENCES Events(EventID) ON DELETE CASCADE,
        FOREIGN KEY (InviterUserID) REFERENCES Users(UserID),
        FOREIGN KEY (InviteeUserID) REFERENCES Users(UserID),
        CONSTRAINT UQ_Event_Invitation UNIQUE (EventID, InviterUserID, InviteeUserID)
    );

    -- Create indexes for EventInvitations
    CREATE INDEX IX_EventInvitations_EventID ON EventInvitations(EventID);
    CREATE INDEX IX_EventInvitations_InviteeUserID ON EventInvitations(InviteeUserID);
    CREATE INDEX IX_EventInvitations_Status ON EventInvitations(Status);

    PRINT 'EventInvitations table created successfully';
END
ELSE
BEGIN
    PRINT 'EventInvitations table already exists';
END

GO

PRINT 'Notifications system schema setup completed';
