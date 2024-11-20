import React, { createContext, useContext, useState } from 'react';

const ListingContext = createContext();

export function ListingProvider({ children }) {
  const [listingData, setListingData] = useState(null);

  return (
    <ListingContext.Provider value={{ listingData, setListingData }}>
      {children}
    </ListingContext.Provider>
  );
}

export function useListing() {
  return useContext(ListingContext);
}