// Geolocation
import fetch from 'node-fetch';
import {FetchLocationError} from "./errors.js";

const euCountriesApi = "https://restcountries.eu/rest/v2/alpha";
const frGeolocationApi = "https://geo.api.gouv.fr";

async function fetchCountry(location) {
    const url = `${euCountriesApi}/${location.country}`;
    let json = undefined;
    try {
        const response = await fetch(url);
        json = await response.json();
    } catch (err) {
        throw new FetchLocationError(location, err, url, 'failed to fetch country');
    }
    if (json.length === 0) {
        throw new FetchLocationError(location, undefined, url, 'country not found');
    }
    return json["name"];

}

async function fetchCounty(location) {
    const url = `${frGeolocationApi}/departements?code=${location.zip.slice(0, 2)}`;
    let json = undefined;
    try {
        const response = await fetch(url);
        json = await response.json();
    } catch (err) {
        throw new FetchLocationError(location, err, url ,'failed to fetch county');
    }
    if (json.length === 0) {
        throw new FetchLocationError(location, undefined, url, 'county not found');
    }
    return json[0]["nom"];
}

async function fetchCity(location) {
    const url = `${frGeolocationApi}/communes?codePostal=${location.zip}&format=json`;
    let json = undefined;
    try {
        const response = await fetch(url);
        json = await response.json();
    } catch (err) {
        throw new FetchLocationError(location, err, url, 'failed to fetch county');
    }
    if (json.length === 0) {
        throw new FetchLocationError(location, undefined, url, 'city not found');
    }
    return json[0]["nom"];
}

async function fetchTimelineLocation(items) {
    return await Promise.all(items.map(item => fetchLocation(item.location)));
}

export async function fetchLocation(location) {
    const items = await Promise.all([fetchCountry(location), fetchCounty(location), fetchCity(location)]);
    return {country: items[0], county: items[1], city: items[2]};
}

export async function fetchUserLocations(user) {
    const items = await Promise.all([fetchLocation(user.location), fetchTimelineLocation(user.items.timeline)]);
    return {location: items[0], timeline: items[1]};
}