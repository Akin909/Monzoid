import React from "react";
import ReactDOM from "react-dom";
import ApolloClient from "apollo-client";
import { ApolloProvider } from "react-apollo";
import { InMemoryCache } from "apollo-cache-inmemory";
import { setContext } from "apollo-link-context";
import { HttpLink } from "apollo-link-http";
import { RestLink } from "apollo-link-rest";
import { ApolloLink } from "apollo-link";

import { getSession, setSession } from "./services/storage";

import "./common/global.css.js";
import Home from "./containers/Home";

// CREDIT: https://www.apollographql.com/docs/link/links/rest.html#examples
const authRestLink = new ApolloLink((operation, forward) => {
    operation.setContext(({ headers }) => {
        const session = getSession();
        return {
            headers: {
                ...headers,
                Accept: "application/json",
                Authorization: session ? session.accessToken : null,
            },
        };
    });

    return forward(operation).map(result => {
        const { restResponses } = operation.getContext();
        const authTokenResponse = restResponses.find(res => res.headers.has("Authorization"));
        if (authTokenResponse) {
            const accessToken = authTokenResponse.headers.get("Authorization");
            setSession({ accessToken });
        }
        return result;
    });
});

const typePatch = (data, __typename) => ({ __typename, ...data });

const restLink = new RestLink({
    uri: process.env.API_URL,
    headers: {
        "Content-Type": "application/json",
    },
    // If the returning data is nested adding a typepatcher allows
    // for adding a typename to the nested object or array
    typePatcher: {
        AppList: data => {
            const apps = data.apps ? data.apps.map(app => typePatch(app, "App")) : apps;
            return { ...data, apps };
        },
        Status: data => {
            const updated = { ...data, token: typePatch(data.token, "Token") };
            return updated;
        },
        UsersList: data => {
            const users = data.users ? data.users.map(user => typePatch(user, "User")) : data.users;
            return { ...data, users };
        },
        Update: data => {
            const app = { ...data, app: typePatch(data.app, "Updated_App") };
            return app;
        },
    },
});

const cache = new InMemoryCache();
const client = new ApolloClient({
    cache,
    link: ApolloLink.from([authRestLink, restLink, new HttpLink()]),
});

function App() {
    return (
        <ApolloProvider client={client}>
            <Home />
        </ApolloProvider>
    );
}

ReactDOM.render(<App />, document.querySelector("#root"));
