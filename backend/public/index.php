<?php

require_once __DIR__ . '/../vendor/autoload.php';

$baseUrlCPX = 'https://services.cuzk.gov.cz/wfs/inspire-CPX-wfs.asp';
$baseUrlAU = "https://services.cuzk.gov.cz/wfs/inspire-AU-wfs.asp";
$unitName = 'Jičín';

$cpxApiClient = new Simekja\Backend\CPXApiClient($baseUrlCPX);
$auApiClient = new Simekja\Backend\AUApiClient($baseUrlAU, $unitName);

$parcelService = new Simekja\Backend\ParcelService(
	$auApiClient,
	$cpxApiClient,
	new Simekja\Backend\FormatTransformer()
);

$router = new Simekja\Backend\Router($parcelService);

$router->dispatch();