const mongoose = require('mongoose')
const Tax = require('../model/taxes') // Assuming your Tax model is defined in a separate file
mongoose.set('strictQuery', false);
mongoose
    .connect(process.env.DATABASE, { dbName: 'Gojango' })
    .then(async () => {
        console.log('mongoDB connected')

        try {
            // Attempt to find a document in the Taxes collection
            const existingTax = await Tax.findOne()

            if (existingTax) {
                console.log('Taxes collection already exists')
            } else {
                // Create a new Tax document if it doesn't exist
                const result = await Tax.create({
                    tax: 5,
                    delivery_charges: 5,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                console.log(`Inserted document with ID: ${result._id}`)
            }
        } catch (err) {
            console.error(`Error inserting or checking data: ${err}`)
        }
    })
    .catch((err) => console.error(err))
