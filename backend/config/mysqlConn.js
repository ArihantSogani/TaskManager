const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.MYSQL_DATABASE || 'task_manager',
    process.env.MYSQL_USER || 'root',
    process.env.MYSQL_PASSWORD || 'root',
    {
        host: process.env.MYSQL_HOST || 'localhost',
        port: process.env.MYSQL_PORT || 3306,
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 20,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            timestamps: true,
            underscored: true
        }
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('MySQL database connected successfully.');
        
        // Sync all models with database
        await sequelize.sync({ alter: true });
        console.log('Database synchronized.');
    } catch (error) {
        console.error('Unable to connect to MySQL database:', error);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
