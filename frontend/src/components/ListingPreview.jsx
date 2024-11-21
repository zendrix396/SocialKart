import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storage, StorageKeys } from '../utils/storage';
import { FaStar, FaStarHalf, FaShoppingCart } from 'react-icons/fa';
import { MdLocationOn } from 'react-icons/md';

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

  if (!content) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-xl text-gray-300">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="bg-[#0f1111] text-white">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-[60px]">
          <h1 className="text-2xl font-bold hover:border-2 hover:border-white p-2">SocialKart</h1>
          
          <div className="flex flex-1 max-w-2xl mx-4">
            <select className="bg-gray-100 px-2 rounded-l-md border-r text-black">
              <option>All</option>
            </select>
            <input 
              type="text" 
              placeholder="Search products" 
              className="flex-1 px-4 text-black outline-none"
            />
            <button className="bg-[#febd69] px-4 rounded-r-md hover:bg-[#f3a847]">
              <FaShoppingCart className="text-black" />
            </button>
          </div>

          <div className="flex items-center space-x-6">
            <div className="hover:border-2 hover:border-white p-2">
              <MdLocationOn className="text-2xl inline" />
              <span className="ml-1">Deliver to</span>
            </div>
            <div className="hover:border-2 hover:border-white p-2">
              <FaShoppingCart className="text-2xl inline" />
              <span className="ml-1">Cart</span>
            </div>
          </div>
        </div>
      </nav>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-12 gap-8">
        {/* Image Gallery */}
        <div className="col-span-5">
          <div className="sticky top-4">
            <div className="flex gap-4">
              {/* Thumbnails */}
              <div className="flex flex-col gap-2">
                {content.selectedImages?.map((img, index) => (
                  <img
                    key={index}
                    src={`data:image/png;base64,${img}`}
                    alt={`Thumbnail ${index + 1}`}
                    className={`w-16 h-16 object-cover cursor-pointer border-2 
                      ${selectedImage === index ? 'border-orange-500' : 'border-gray-200'}`}
                    onClick={() => setSelectedImage(index)}
                  />
                ))}
              </div>
              
              {/* Main Image */}
              <div className="flex-1">
                {content.selectedImages?.[selectedImage] && (
                  <img
                    src={`data:image/png;base64,${content.selectedImages[selectedImage]}`}
                    alt="Product"
                    className="w-full rounded-lg"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="col-span-4">
          <h1 className="text-2xl font-medium mb-2 text-gray-700">{content.title}</h1>
          
          {/* Ratings */}
          <div className="flex items-center mb-4">
            <div className="flex text-yellow-400">
              <FaStar />
              <FaStar />
              <FaStar />
              <FaStar />
              <FaStarHalf />
            </div>
            <span className="ml-2 text-blue-600">4.5 out of 5</span>
          </div>

          {/* Price */}
          <div className="mb-4">
            <span className="text-sm text-gray-700">List Price:</span>
            <span className="text-3xl font-bold text-gray-700">
              ${content.price || 'XX.XX'}
            </span>
          </div>

          <div className="mb-6">
            <p className="text-gray-600">{content.description}</p>
          </div>

          {/* Key Features */}
          <div className="mb-6">
            <h2 className="text-xl font-medium mb-2 text-gray-700">Key Features</h2>
            <ul className="list-disc list-inside space-y-2">
              {content.key_features?.map((feature, index) => (
                <li key={index} className="text-gray-600">{feature}</li>
              ))}
            </ul>
          </div>

          {/* Technical Details */}
          <div className="mb-6">
            <h2 className="text-xl font-medium mb-2 text-gray-700">Technical Details</h2>
            <table className="w-full">
              <tbody>
                {Object.entries(content.technical_details || {}).map(([key, value]) => (
                  <tr key={key} className="border-b border-gray-200">
                    <td className="py-2 font-medium text-gray-600">{key}</td>
                    <td className="py-2 text-gray-600">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Search Terms */}
          <div className="mb-6">
            <h2 className="text-xl font-medium mb-2 text-gray-700">Search Terms</h2>
            <div className="flex flex-wrap gap-2">
              {content.search_terms?.map((term, index) => (
                <span 
                  key={index}
                  className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm"
                >
                  {term}
                </span>
              ))}
            </div>
          </div>
          {/* Features */}

        </div>

        {/* Buy Box */}
        <div className="col-span-3">
          <div className="border rounded-lg p-4">
            <div className="text-3xl font-bold mb-4 text-gray-700">
              ${content.price || 'XX.XX'}
            </div>
            
            <div className="text-sm mb-4 text-gray-700">
              FREE delivery <span className="font-bold">Tomorrow</span>
              <br />
              if you order within 4 hrs
            </div>

            <div className="mb-4 text-gray-700">
              <MdLocationOn className="inline" /> Deliver to Your Location
            </div>

            <div className="text-xl font-bold text-green-600 mb-4">
              In Stock
            </div>

            <button className="w-full bg-yellow-400 hover:bg-yellow-500 py-2 rounded-full mb-2">
              Add to Cart
            </button>
            <button className="w-full bg-orange-400 hover:bg-orange-500 py-2 rounded-full">
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ListingPreview;