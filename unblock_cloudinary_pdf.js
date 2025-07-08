import cloudinaryModule from 'cloudinary';
const cloudinary = cloudinaryModule.v2;

// Diisi sesuai cloudinary_config.php
cloudinary.config({ 
  cloud_name: 'dqwnckoeu', 
  api_key: '345733924435416', 
  api_secret: 'p_QqW6bmYSxSADSfK7O-OCctL4k' 
});

// Ganti dengan public_id file PDF Anda (tanpa ekstensi jika upload via raw)
const publicId = 'Penegasan Susenas MKP 2022 - 10082022-1751613954.pdf';

async function unblockDelivery(publicId) {
  try {
    // Update access_mode ke public
    const result = await cloudinary.api.update(publicId, {
      resource_type: 'raw',
      access_mode: 'public',
    });
    console.log('Berhasil update access_mode:', result);
  } catch (err) {
    console.error('Gagal update access_mode:', err);
  }
}

unblockDelivery(publicId); 