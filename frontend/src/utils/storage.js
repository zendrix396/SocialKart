export const StorageKeys = {
    LISTING_CONTENT: 'listingContent',
    LISTING_IMAGES: 'listingImages'
  };
  
  const compressImages = (images) => {
    // Store up to 30 images
    return images.slice(0, 30).map(img => {
      // Future compression logic can go here
      return img;
    });
  };
  
  export const storage = {
    set: (key, value) => {
      try {
        if (key === StorageKeys.LISTING_CONTENT) {
          // Store content without images
          const { images, ...contentWithoutImages } = value;
          localStorage.setItem(key, JSON.stringify(contentWithoutImages));
        } else if (key === StorageKeys.LISTING_IMAGES) {
          // Store compressed images separately
          const compressedImages = compressImages(value);
          localStorage.setItem(key, JSON.stringify(compressedImages));
        } else {
          localStorage.setItem(key, JSON.stringify(value));
        }
      } catch (error) {
        console.error('Error saving to localStorage:', error);
        // Fallback: Try to store without images if quota is exceeded
        if (error.name === 'QuotaExceededError') {
          const { images, ...contentWithoutImages } = value;
          localStorage.setItem(key, JSON.stringify(contentWithoutImages));
        }
      }
    },
    
    get: (key) => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (error) {
        console.error('Error reading from localStorage:', error);
        return null;
      }
    },
    
    remove: (key) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing from localStorage:', error);
      }
    }
  };