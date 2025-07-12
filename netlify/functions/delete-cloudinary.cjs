const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const { public_id } = JSON.parse(event.body);
  if (!public_id) {
    return { statusCode: 400, body: 'No public_id provided' };
  }
  try {
    // Coba hapus sebagai raw
    let result = await cloudinary.uploader.destroy(public_id, { resource_type: 'raw' });
    if (result.result !== 'ok') {
      // Jika gagal, coba hapus sebagai image
      result = await cloudinary.uploader.destroy(public_id, { resource_type: 'image' });
    }
    if (result.result === 'ok') {
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    } else {
      return { statusCode: 500, body: JSON.stringify({ success: false, error: result.result }) };
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: err.message }) };
  }
}; 