var link = function (created, name, url, posterID, posterName) {
	return {
		created: created,
		name: name,
		url: url,
		poster: {
			id: posterID,
			name: posterName
		}
	};
};
