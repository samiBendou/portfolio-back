import {FindUserError, UpdateLocationError} from "./errors.js"
import {fetchUserLocations} from "./geolocation.js";

export async function findUser(username, client) {
    let user = await client.db('portfolio').collection('users').findOne({"username": username});
    if (user === null) {
        throw new FindUserError(username, undefined, `User does not exist`);
    }
    try {
        let items = await fetchUserLocations(user);
        user["location"] = items[0];
        user["items"].timeline.forEach((item, index) => {
            item.location = items[1][index]
        });
    } catch(err) {
        throw new UpdateLocationError(undefined, err, `Error during location update`);
    }
    return user;
}