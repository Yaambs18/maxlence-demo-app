const express = require('express');

const app = express();

const port = process.env.PORT || 3000; // Use the environment port or default to 3000

app.use((req, res, next) => {
    res.send("Node server running")
})

app.listen(port, () => {
  console.log(`Server is running on port ${port} in ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;