const { genetateGDSCCoverURL } = require('./utils/GDSCUtils');
const simpleReturn = require('netlify-functions-simple-return');
const fetch = require('node-fetch');
const { client: sanityClient } = require('./utils/sanity');
exports.handler = async(event) => {
    const headers = {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': '*',
        'access-control-allow-methods': 'GET, POST, PUT, DELETE',
    };

    if (event.httpMethod !== 'POST') {
        // To enable CORS
        console.log('preflight');
        return {
            statusCode: 200, // <-- Important!
            headers,
            body: 'This was not a POST request!',
        };
    }
    const body = JSON.parse(event.body);
    const { title, guestName, guestTitle, guestImage, time, id } = body;

    try {
        const url = genetateGDSCCoverURL(
            title,
            guestName,
            guestTitle,
            guestImage,
            time,
            id
        );
        const res = await fetch(url);

        const imageAsset = await sanityClient.assets.upload('image', res.body, {
            filename: title,
        });

        const updatedRecord = await sanityClient
            .patch(id)
            .set({
                coverImage: {
                    _type: 'image',
                    asset: {
                        _type: 'reference',
                        _ref: imageAsset._id,
                    },
                },
            })
            .commit();

        return { statusCode: 200, body: JSON.stringify({ url }), headers };
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify({ msg: 'Something went wrong' }),
        };
    }
};