
// Geolocation
import fetch from 'node-fetch';

const euCountriesApi = "https://restcountries.eu/rest/v2/alpha";
const frGeolocationApi = "https://geo.api.gouv.fr";

const fetchCountry = (location) => {
    const countryUrl = `${euCountriesApi}/${location.country}`;
    return new Promise((resolve, reject) => {
        fetch(countryUrl)
            .then(response => response.json())
            .then(data => resolve(data["name"]))
            .catch((err) => reject(`Unable to fetch ${countryUrl} ${err}`));
    });
};

const fetchCounty = (location) => {
    const departmentUrl = `${frGeolocationApi}/departements?code=${location.zip.slice(0, 2)}`;
    return new Promise((resolve, reject) => {
        fetch(departmentUrl)
            .then(response => response.json())
            .then((data) => resolve(data[0]["nom"]))
            .catch((e) => reject(`Unable to fetch ${departmentUrl} ${e}`));
    });
}

const fetchCity = (location) => {
    const cityUrl = `${frGeolocationApi}/communes?codePostal=${location.zip}&format=json`;
    return new Promise((resolve, reject) => {
        fetch(cityUrl)
            .then(response => response.json())
            .then(data => resolve(data[0]["nom"]))
            .catch((err) => reject(`Unable to fetch ${cityUrl} ${err}`));
    });
}

const fetchTimelineLocation = (items) => {
    return new Promise((resolve, reject) => {
            Promise.all(items.map(item => fetchLocation(item.location)))
                .then(locations => resolve(locations))
                .catch(e => reject(e));
        }
    )
};

export const fetchLocation = (location) => {
    return new Promise((resolve, reject) => {
            Promise.all([fetchCountry(location), fetchCounty(location), fetchCity(location)])
                .then(data => resolve({country: data[0], county: data[1], city: data[2]}))
                .catch(err => reject(err));
        }
    )
};

export const fetchUserLocations = (user) => {
    return Promise.all([fetchLocation(user.location), fetchTimelineLocation(user.items.timeline)])
}
