// Shared data store for property data
(function () {
    const DATA_URL = '/data/properties.json';
    let cache = null;
    let pendingRequest = null;

    async function fetchProperties() {
        if (cache) {
            return cache;
        }

        if (!pendingRequest) {
            pendingRequest = fetch(DATA_URL)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`Unable to load property data: ${response.status}`);
                    }
                    return response.json();
                })
                .then((data) => {
                    cache = data;
                    return cache;
                })
                .finally(() => {
                    pendingRequest = null;
                });
        }

        return pendingRequest;
    }

    window.PropertyDataStore = {
        /**
         * Returns a promise that resolves to the full property list.
         * @returns {Promise<Array>}
         */
        getProperties() {
            return fetchProperties();
        },

        /**
         * Returns a promise that resolves to properties marked as featured.
         * @returns {Promise<Array>}
         */
        getFeatured() {
            return fetchProperties().then((properties) =>
                properties.filter((property) => property.featured)
            );
        },

        /**
         * Returns a promise that resolves to properties marked for the hero carousel.
         * Falls back to the first seven properties if none are flagged.
         * @returns {Promise<Array>}
         */
        getHeroSelection() {
            return fetchProperties().then((properties) => {
                const heroProperties = properties.filter((property) => property.hero);
                if (heroProperties.length > 0) {
                    return heroProperties;
                }
                return properties.slice(0, 7);
            });
        }
    };
})();

