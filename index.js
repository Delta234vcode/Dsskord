const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Папка з твоєю HTML-грою:
app.use(express.static('public'));

// Перевірка, що бекенд працює
app.get('/ping', (req, res) => res.send('pong'));

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
