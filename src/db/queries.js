import { FindUserError } from "../errors.js";
import { fetchUserLocations } from "../utils/geolocation.js";

export async function findUser(username, client) {
    let user = await client.db("portfolio").collection("users").findOne({ username: username });
    if (user === null) {
        throw new FindUserError(username, undefined, `User does not exist !`);
    }

    const items = await fetchUserLocations(user);
    user.location.resolved = items.location;
    [...user.items.projects, ...user.items.education, ...user.items.experience].forEach((item, index) => {
        if (!item.location) {
            return;
        }
        item.location.resolved = items.timeline[index];
    });
    return user;
}

export async function updateUser(username, data, client) {
    let user = await client.db("portfolio").collection("users").updateOne({ username: username }, { $set: data });
    return user;
}
