'use client';


import {useEffect, useState} from "react";

export const useCSRF = () => {
    const [csrfToken, setCSRFToken] = useState<string>('');

    useEffect(() => {
        fetch('api/csrf')
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
                if (data?.csrfToken) {
                    setCSRFToken(data.csrfToken);
                }
            })
            .catch((error) => {
                console.error(error);
            })
    })

    return csrfToken;
}