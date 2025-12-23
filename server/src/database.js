// Database connection and user operations
const sql = require('mssql/msnodesqlv8'); // Force use of Windows native driver
const bcrypt = require('bcryptjs');

// Database configuration using connection string for Windows Auth
const serverName = process.env.DB_SERVER || 'localhost';
const dbName = process.env.DB_NAME || 'PwCVolunteerPlatform';
const connectionString = `server=${serverName};Database=${dbName};Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}`;

const dbConfig = {
    connectionString: connectionString
};

// Connection pool
let poolPromise;

async function getPool() {
    if (!poolPromise) {
        poolPromise = new sql.ConnectionPool(dbConfig)
            .connect()
            .then(pool => {
                console.log('✅ Connected to SQL Server database');
                return pool;
            })
            .catch(err => {
                console.error('❌ Database connection error:', err);
                throw err;
            });
    }
    return poolPromise;
}

// User database operations
const userDb = {
    // Create a new user
    async createUser(userData) {
        try {
            const pool = await getPool();
            const { email, password, firstName, lastName, role = 'employee', department, location } = userData;
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);
            
            const result = await pool.request()
                .input('email', sql.NVarChar, email)
                .input('passwordHash', sql.NVarChar, hashedPassword)
                .input('firstName', sql.NVarChar, firstName)
                .input('lastName', sql.NVarChar, lastName)
                .input('role', sql.NVarChar, role)
                .input('department', sql.NVarChar, department)
                .input('location', sql.NVarChar, location)
                .query(`
                    INSERT INTO Users (Email, PasswordHash, FirstName, LastName, Role, Department, Location, CreatedAt, UpdatedAt)
                    OUTPUT INSERTED.UserID, INSERTED.Email, INSERTED.FirstName, INSERTED.LastName, INSERTED.Role, INSERTED.Department, INSERTED.Location, INSERTED.CreatedAt
                    VALUES (@email, @passwordHash, @firstName, @lastName, @role, @department, @location, GETUTCDATE(), GETUTCDATE())
                `);
            
            return result.recordset[0];
        } catch (error) {
            if (error.number === 2627) { // Unique constraint violation
                throw new Error('User with this email already exists');
            }
            throw error;
        }
    },

    // Find user by email
    async findUserByEmail(email) {
        try {
            const pool = await getPool();
            const result = await pool.request()
                .input('email', sql.NVarChar, email)
                .query(`
                    SELECT UserID, Email, PasswordHash, FirstName, LastName, Role, Department, Location, CreatedAt, UpdatedAt
                    FROM Users 
                    WHERE Email = @email AND IsActive = 1
                `);
            
            return result.recordset[0] || null;
        } catch (error) {
            throw error;
        }
    },

    // Verify user password
    async verifyPassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    },

    // Get user by ID
    async getUserById(userId) {
        try {
            const pool = await getPool();
            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .query(`
                    SELECT UserID, Email, FirstName, LastName, Role, Department, Location, CreatedAt, UpdatedAt
                    FROM Users 
                    WHERE UserID = @userId AND IsActive = 1
                `);
            
            return result.recordset[0] || null;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = {
    getPool,
    userDb,
    sql
};