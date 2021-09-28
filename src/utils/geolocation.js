// Geolocation
import fetch from "node-fetch";
import { FetchLocationError } from "../errors.js";

const euCountriesApi = "https://restcountries.com/v3.1/alpha    ";
const frGeolocationApi = "https://geo.api.gouv.fr";

async function fetchCountry(location) {
    if (!location.country) {
        return "Unknown";
    }
    const url = `${euCountriesApi}/${location.country}`;
    let json = undefined;
    try {
        const response = await fetch(url);
        json = await response.json();
    } catch (err) {
        throw new FetchLocationError(location, err, url, "failed to fetch country");
    }
    if (json.length === 0) {
        return "Unknown";
    }
    return json["name"]["common"];
}

async function fetchCounty(location) {
    if (!location.zip) {
        return "Unknown";
    }
    const url = `${frGeolocationApi}/departements?code=${location.zip.slice(0, 2)}`;
    let json = undefined;
    try {
        const response = await fetch(url);
        json = await response.json();
    } catch (err) {
        throw new FetchLocationError(location, err, url, "failed to fetch county");
    }
    if (json.length === 0) {
        return "Unknown";
    }
    return json[0]["nom"];
}

async function fetchCity(location) {
    if (!location.zip) {
        return "Unknown";
    }
    const url = `${frGeolocationApi}/communes?codePostal=${location.zip}&format=json`;
    let json = undefined;
    try {
        const response = await fetch(url);
        json = await response.json();
    } catch (err) {
        throw new FetchLocationError(location, err, url, "failed to fetch city");
    }
    if (json.length === 0) {
        return "Unknown";
    }
    return json[0]["nom"];
}

async function fetchTimelineLocation(items) {
    return await Promise.all(items.map((item) => fetchLocation(item.location)));
}

export async function fetchLocation(location) {
    if (!location) {
        return undefined;
    }
    const items = await Promise.all([fetchCountry(location), fetchCounty(location), fetchCity(location)]);
    return { country: items[0], county: items[1], city: items[2] };
}

export async function fetchUserLocations(user) {
    const timeline = [...user.items.projects, ...user.items.education, ...user.items.experience];
    const items = await Promise.all([fetchLocation(user.location), fetchTimelineLocation(timeline)]);
    return { location: items[0], timeline: items[1] };
}
