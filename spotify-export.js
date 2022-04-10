function getSpotifyTracks() {
    let contentsContainers = document.querySelectorAll('.contentSpacing');
    contentsContainers[contentsContainers.length - 1].scrollIntoView();

    return parseSpotifyTracksPage().then(tracks => {
        console.log(tracks);
        let csvContent = "data:text/csv;charset=utf-8,ID;TRACK;AUTHOR;ALBUM;DATE_ADDED\r\n";

        tracks.forEach(function(track) {
            let row = track.id + ';' + track.trackName + ';' + track.Author + ';' + track.Album + ';' + track.AddDate;
            csvContent += row + "\r\n";
        });

        let encodedUri = encodeURI(csvContent);
        let link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "spotify_export.csv");
        document.body.appendChild(link); // Required for FF

        link.click();
        return tracks;
    })
}

async function parseSpotifyTracksPage () {
    let tracks = [];
    let lastId = 0;
    let intervalId = 0;
    const waitForTracksParsing = new Promise((resolve) => {
        intervalId = setInterval(function () {
            let PageTracks = document.querySelectorAll('div[data-testid="tracklist-row"]');
            let curLastId = 0;
            for (let i = 0; i < PageTracks.length; i++) {
                const result = getTrackFromRow(PageTracks[i])
                if (result !== false) {
                    tracks[result[0]] = result[1]
                    if (result[0] !== 0) {
                        curLastId = result[0];
                    }
                }
            }
            console.log('tracks count ' + tracks.length);
            if (lastId === curLastId) {
                console.log('resolved');
                resolve(tracks);
            } else {
                lastId = curLastId;
            }
            PageTracks[PageTracks.length - 2].scrollIntoView(); // last element is player row
        }.bind(lastId, tracks), 2000)
    })

    tracks = await waitForTracksParsing.then(value => {
        console.log('interval cleared');
        return value;
    });

    clearInterval(intervalId);

    return tracks;
}

function getTrackFromRow(row) {
    let track = {}
    try {
        track.id = row.children[0].children[0].children[0].innerHTML;
        track.trackName = row.children[1].children[1].children[0].innerHTML;
        track.Author = row.children[1].children[1].children[1].children[0].innerHTML;
        track.Album = row.children[2].children[0].children[0].innerHTML;
        track.AddDate = row.children[3].children[0].innerHTML;
    } catch (Exception) {
        return false;
    }

    return [Number(track.id), track]
}
