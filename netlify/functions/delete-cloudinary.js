const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dqwnckoeu',
  api_key: '345733924435416',
  api_secret: 'p_QqW6bmYSxSADSfK7O-OCctL4k'
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
    await cloudinary.uploader.destroy(public_id, { resource_type: 'auto' });
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: err.message }) };
  }
}; 