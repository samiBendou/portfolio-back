import {FindUserError} from "./errors.js"
import {fetchUserLocations} from "./geolocation.js";

export async function findUser(username, client) {
    let user = await client.db('portfolio').collection('users').findOne({"username": username});
    if (user === null) {
        throw new FindUserError(username, undefined, `User does not exist`);
    }

    const items = await fetchUserLocations(user);
    user["location"] = items.location;
    user["items"].timeline.forEach((item, index) => {
        item.location = items.timeline[index];
    });
    return user;
}