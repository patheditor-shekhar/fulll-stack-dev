const API_BASE_URL = "https://fakestoreapi.com";

async function requestJson(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        ...options,
        body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
    }

    const text = await response.text();
    if (!text) {
        return null;
    }

    return JSON.parse(text);
}

window.apiService = {
    fetchProducts: async () => requestJson("/products"),
    createProduct: async (product) => requestJson("/products", {
        method: "POST",
        body: product
    }),
    deleteProduct: async (productId) => requestJson(`/products/${productId}`, {
        method: "DELETE"
    })
};