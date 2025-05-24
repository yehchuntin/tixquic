const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

admin.initializeApp();

exports.uploadImage = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    try {
      const bucket = admin.storage().bucket();
      const file = bucket.file(`events/${Date.now()}_${req.body.filename}`);
      
      const stream = file.createWriteStream({
        metadata: {
          contentType: req.body.contentType,
        },
      });

      stream.on('error', (err) => {
        console.error(err);
        res.status(500).send(err);
      });

      stream.on('finish', async () => {
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: '03-09-2491',
        });
        res.status(200).send({ url });
      });

      stream.end(Buffer.from(req.body.file, 'base64'));
    } catch (error) {
      console.error(error);
      res.status(500).send(error);
    }
  });
});