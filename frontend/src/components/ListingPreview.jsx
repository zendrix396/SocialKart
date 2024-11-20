import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { storage, StorageKeys } from '../utils/storage';

function ListingPreview() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  useEffect(() => {
    try {
      const storedContent = storage.get(StorageKeys.LISTING_CONTENT);
      const storedImages = storage.get(StorageKeys.LISTING_IMAGES);

      if (!storedContent || !storedContent.requestId || storedContent.requestId !== requestId) {
        console.log('Invalid or missing data, redirecting to home');
        navigate('/');
        return;
      }

      setContent({
        ...storedContent.structured_content,
        selectedImages: storedImages || []
      });
    } catch (error) {
      console.error('Error loading preview data:', error);
      navigate('/');
    }
  }, [navigate, requestId]);
  if (!content) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-xl text-gray-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-800 text-gray-200 rounded-lg">
      <div className="grid grid-cols-12 gap-6">
        {/* Images and Video Section */}
        <div className="col-span-5">
          {content.selectedImages && content.selectedImages.length > 0 && (
            <>
              <div className="mb-4">
                <img
                  src={`data:image/png;base64,${content.selectedImages[selectedImage]}`}
                  alt="Product"
                  className="w-full rounded-lg"
                />
              </div>
              <div className="grid grid-cols-5 gap-2">
                {content.selectedImages.map((img, index) => (
                  <img
                    key={index}
                    src={`data:image/png;base64,${img}`}
                    alt={`Thumbnail ${index + 1}`}
                    className={`cursor-pointer rounded ${
                      selectedImage === index ? 'ring-2 ring-orange-500' : ''
                    }`}
                    onClick={() => setSelectedImage(index)}
                  />
                ))}
              </div>
            </>
          )}
          
          {/* Video Player */}
          {content.video_url && (
            <div className="mt-4">
              <video controls className="w-full rounded">
                <source src={content.video_url} type="video/mp4" />
              </video>
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="col-span-7">
          <h1 className="text-2xl font-medium mb-4">{content.title}</h1>
          
          {/* Price Section */}
          <div className="mb-6">
            <span className="text-3xl font-bold text-orange-500">$XX.XX</span>
          </div>

          {/* Key Features */}
          {content.key_features && content.key_features.length > 0 && (
            <div className="mb-6">
              <ul className="list-disc list-inside space-y-2">
                {content.key_features.map((feature, index) => (
                  <li key={index} className="text-gray-300">{feature}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Description */}
          {content.description && (
            <div className="mb-6">
              <h2 className="text-xl font-medium mb-2">About this item</h2>
              <p className="whitespace-pre-line text-gray-300">{content.description}</p>
            </div>
          )}

          {/* Technical Details */}
          {content.technical_details && Object.keys(content.technical_details).length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-medium mb-2">Technical Details</h2>
              <table className="w-full">
                <tbody>
                  {Object.entries(content.technical_details).map(([key, value]) => (
                    <tr key={key} className="border-b border-gray-700">
                      <td className="py-2 font-medium text-gray-300">{key}</td>
                      <td className="py-2 text-gray-400">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ListingPreview;