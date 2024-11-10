# MERN Stack Backend

This is the backend for a MERN stack application, built with Node.js, Express.js, and MongoDB. It handles multiple modules including cart, categories, chat, dispensary, notifications, orders, products, taxes, transactions, users, and user locations.

## Table of Contents

- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Modules Overview](#modules-overview)
  - [Cart Module](#cart-module)
  - [Categories Module](#categories-module)
  - [Chat Module](#chat-module)
  - [Dispensary Module](#dispensary-module)
  - [Notifications Module](#notifications-module)
  - [Orders Module](#orders-module)
  - [Products Module](#products-module)
  - [Taxes Module](#taxes-module)
  - [Transactions Module](#transactions-module)
  - [User Module](#user-module)
  - [User Locations Module](#user-locations-module)
- [Folder Structure](#folder-structure)
- [License](#license)

## Technologies Used

- Node.js
- Express.js
- MongoDB (with Mongoose ODM)
- JWT (JSON Web Tokens) for authentication
- bcrypt for password hashing
- dotenv for environment variables
- Nodemon for development

## Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/)

## Installation

1. **Clone the repository**:

    ```bash
    git clone <repository-url>
    ```

2. **Navigate to the backend directory**:

    ```bash
    cd backend
    ```

3. **Install dependencies**:

    ```bash
    npm install
    ```

## Environment Variables

Create a `.env` file in the root directory and configure the following environment variables:

```bash
# MongoDB connection string
MONGO_URI=mongodb://localhost:27017/mydatabase

# JWT secret key
JWT_SECRET=your_jwt_secret

# Port for the server
PORT=5000
