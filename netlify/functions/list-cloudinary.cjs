const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.handler = async function(event, context) {
  try {
    const resultRaw = await cloudinary.api.resources({ resource_type: 'raw', max_results: 100 });
    const resultImage = await cloudinary.api.resources({ resource_type: 'image', max_results: 100 });
    const allResources = [...resultRaw.resources, ...resultImage.resources];
    const files = allResources.map(item => {
      const format = item.format || (item.public_id.split('.').pop() || '').toLowerCase();
      const original_filename = item.filename || item.original_filename || item.public_id.split('/').pop().split('.')[0];
      return {
        public_id: item.public_id,
        url: item.secure_url,
        format,
        bytes: item.bytes,
        created_at: item.created_at,
        original_filename,
        resource_type: item.resource_type
      };
    });
    return {
      statusCode: 200,
      body: JSON.stringify(files)
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: e.message })
    };
  }
}; 