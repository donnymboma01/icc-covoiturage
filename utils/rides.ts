import { geohashForLocation } from 'geofire-common';
import { getCoordinates } from './geocoding';

export const prepareRideLocation = async (address: string) => {
  const coordinates = await getCoordinates(address);
  return {
    lat: coordinates.lat,
    lng: coordinates.lng,
    geohash: geohashForLocation([coordinates.lat, coordinates.lng])
  };
};
