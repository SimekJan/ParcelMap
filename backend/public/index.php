<?php

require_once __DIR__ . '/../vendor/autoload.php';

$baseUrl = 'https://example.com'; // Replace with the actual base URL of the CUZK API

$cuzkApiClient = new Simekja\Backend\CuzkApiClient($baseUrl);

$parcelService = new Simekja\Backend\ParcelService(
	$cuzkApiClient,
	new Simekja\Backend\FormatTransformer()
);

$router = new Simekja\Backend\Router($parcelService);

$router->dispatch();