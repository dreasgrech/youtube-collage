var link = function (id, created, name, url, posterID, posterName) {
	return {
        id: id,
		created: created,
		name: name,
		url: url,
		poster: {
			id: posterID,
			name: posterName
		}
	};
};
