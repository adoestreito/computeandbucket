//! Default Compute template program.

/// <reference types="@fastly/js-compute" />
// import { CacheOverride } from "fastly:cache-override";
// import { Logger } from "fastly:logger";
import { env } from "fastly:env";
import { includeBytes } from "fastly:experimental";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// Load a static file as a Uint8Array at compile time.
// File path is relative to root of project, not to this file
const welcomePage = includeBytes("./src/welcome-to-compute.html");

// The entry point for your application.
//
// Use this fetch event listener to define your main request handling logic. It could be
// used to route based on the request properties (such as method or path), send
// the request to a backend, make completely new requests, and/or generate
// synthetic responses.

addEventListener("fetch", (event) => event.respondWith(handleRequest(event)));



async function handleRequest(event) {
  console.log(env("ACCESS_KEY_ID"));
  console.log(env("SECRET_ACCESS_KEY"));

  // Get the client request.
  const req = event.request;

  // Filter requests that have unexpected methods.
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return new Response("This method is not allowed", {
      status: 405,
    });
  }

  const url = new URL(req.url);

  // if (url.pathname === "/") {
  console.log(url.pathname.slice(1, url.pathname.length));
  // Replace with your Fastly Object Store region and credentials (ideally fetched from environment variables)
  const s3Client = new S3Client({
    region: "eu-central", // Replace with the region specified in your Fastly Object Store URL (e.g., "us-central1")
    endpoint: "https://eu-central.object.fastlystorage.app",
    credentials: {
      accessKeyId: env("ACCESS_KEY_ID"), // Your Fastly Object Store Access Key
      secretAccessKey: env("SECRET_ACCESS_KEY"), // Your Fastly Object Store Secret Key
    },
    forcePathStyle: true, // Important for some S3-compatible services like Fastly Object Store
  });
  let obj = "index.html";
  if (url.pathname != "/") {
    obj = url.pathname.slice(1, url.pathname.length);
  }

  try {
    const bucketName = "my-fastly-bucket"; // The name of your Fastly Object Store bucket
    const keyName = url.pathname;

    const getObjectCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: obj,
    });

    const response = await s3Client.send(getObjectCommand);

    if (response.Body) {
      const body = await response.Body.transformToString();
      return new Response(body, {
        status: 200,
        headers: { "Content-Type": response.ContentType || "text/plain" },
      });
    } else {
      return new Response("Object not found or empty.", { status: 404 });
    }
  } catch (error) {
    console.error("Error fetching from Fastly Object Store:", error);
    return new Response("Error fetching from Fastly Object Store", { status: 500 });
  }

}
// } //the one from url.pathname
