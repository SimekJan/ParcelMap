import { apiClient } from './client'
import type { components } from './schema'

type Parcel = components['schemas']['Parcel']

export async function getParcels(bbox: number[]): Promise<Parcel[]> {
    void bbox
    return mockParcels
}

const mockParcels: Parcel[] = [
    {
        parcelNumber: "300/7",
        municipalityName: "Staré Hrady",
        area: "14331",
        zoning: "Staré Hrady",
        geometry: "<gml:Polygon xmlns:gml=\"http://www.opengis.net/gml/3.2\" gml:id=\"P.CPX.1887198604\" srsName=\"http://www.opengis.net/def/crs/EPSG/0/3857\" srsDimension=\"2\">\n                    <gml:exterior>\n                        <gml:LinearRing>\n                            <gml:posList>1693084 6513465.85 1693227.01 6513412.6 1693324.56 6513361.15 1693336.93 6513370.92 1693342.76 6513398.62 1693340.57 6513417.06 1693299.81 6513434.61 1693278.23 6513443.91 1693242.15 6513459.44 1693221.39 6513468.38 1693212.06 6513472.4 1693098.4 6513512.49 1693120.75 6513600.96 1693118.59 6513610.55 1693089.37 6513623.92 1692974.02 6513634.57 1692951.04 6513507.43 1693080.24 6513457.78 1693082.31 6513462.22 1693084 6513465.85</gml:posList>\n                        </gml:LinearRing>\n                    </gml:exterior>\n                </gml:Polygon>"
    },
    {
        parcelNumber: "300/15",
        municipalityName: "Staré Hrady",
        area: "429",
        zoning: "Staré Hrady",
        geometry: "<gml:Polygon xmlns:gml=\"http://www.opengis.net/gml/3.2\" gml:id=\"P.CPX.2223480604\" srsName=\"http://www.opengis.net/def/crs/EPSG/0/3857\" srsDimension=\"2\">\n                    <gml:exterior>\n                        <gml:LinearRing>\n                            <gml:posList>1693324.56 6513361.15 1693227.01 6513412.6 1693084 6513465.85 1693082.31 6513462.22 1693224.58 6513409.74 1693320.46 6513357.55 1693324.56 6513361.15</gml:posList>\n                        </gml:LinearRing>\n                    </gml:exterior>\n                </gml:Polygon>"
    },
    {
        parcelNumber: "49/2",
        municipalityName: "Staré Hrady",
        area: "722",
        zoning: "Staré Hrady",
        geometry: "<gml:Polygon xmlns:gml=\"http://www.opengis.net/gml/3.2\" gml:id=\"P.CPX.1887006604\" srsName=\"http://www.opengis.net/def/crs/EPSG/0/3857\" srsDimension=\"2\">\n                    <gml:exterior>\n                        <gml:LinearRing>\n                            <gml:posList>1693224.24 6513652.37 1693205.86 6513650.73 1693181.5 6513648.61 1693186.88 6513608.55 1693230.15 6513610.74 1693224.24 6513652.37</gml:posList>\n                        </gml:LinearRing>\n                    </gml:exterior>\n                </gml:Polygon>"
    },
    {
        parcelNumber: "43/1",
        municipalityName: "Staré Hrady",
        area: "688",
        zoning: "Staré Hrady",
        geometry: "<gml:Polygon xmlns:gml=\"http://www.opengis.net/gml/3.2\" gml:id=\"P.CPX.1887001604\" srsName=\"http://www.opengis.net/def/crs/EPSG/0/3857\" srsDimension=\"2\">\n                    <gml:exterior>\n                        <gml:LinearRing>\n                            <gml:posList>1693419.74 6513647.46 1693421.83 6513614.35 1693420.02 6513589.24 1693413.41 6513566.65 1693441.05 6513545.39 1693449.06 6513547.29 1693421.91 6513658.42 1693415.33 6513681.36 1693419.74 6513647.46</gml:posList>\n                        </gml:LinearRing>\n                    </gml:exterior>\n                </gml:Polygon>"
    },
    {
        parcelNumber: "9/14",
        municipalityName: "Staré Hrady",
        area: "3766",
        zoning: "Staré Hrady",
        geometry: "<gml:Polygon xmlns:gml=\"http://www.opengis.net/gml/3.2\" gml:id=\"P.CPX.2600233604\" srsName=\"http://www.opengis.net/def/crs/EPSG/0/3857\" srsDimension=\"2\">\n                    <gml:exterior>\n                        <gml:LinearRing>\n                            <gml:posList>1693603.65 6513529.3 1693615.46 6513531.68 1693606.42 6513553.05 1693597.33 6513585.09 1693593.69 6513606.38 1693590.43 6513625.41 1693609.03 6513675.48 1693529.51 6513699.62 1693526.11 6513688.85 1693561.18 6513677.7 1693542.21 6513604.69 1693500.67 6513601.6 1693529.94 6513567.86 1693551.33 6513543.23 1693556.13 6513535.12 1693587.77 6513535.79 1693590.72 6513527.11 1693603.65 6513529.3</gml:posList>\n                        </gml:LinearRing>\n                    </gml:exterior>\n                </gml:Polygon>"
    },
    {
        parcelNumber: "13/2",
        municipalityName: "Staré Hrady",
        area: "38",
        zoning: "Staré Hrady",
        geometry: "<gml:Polygon xmlns:gml=\"http://www.opengis.net/gml/3.2\" gml:id=\"P.CPX.2222742604\" srsName=\"http://www.opengis.net/def/crs/EPSG/0/3857\" srsDimension=\"2\">\n                    <gml:exterior>\n                        <gml:LinearRing>\n                            <gml:posList>1693632.68 6513707.79 1693609.03 6513675.48 1693614.22 6513674.6 1693632.68 6513707.79</gml:posList>\n                        </gml:LinearRing>\n                    </gml:exterior>\n                </gml:Polygon>"
    },
    {
        parcelNumber: "13/1",
        municipalityName: "Staré Hrady",
        area: "127",
        zoning: "Staré Hrady",
        geometry: "<gml:Polygon xmlns:gml=\"http://www.opengis.net/gml/3.2\" gml:id=\"P.CPX.2222741604\" srsName=\"http://www.opengis.net/def/crs/EPSG/0/3857\" srsDimension=\"2\">\n                    <gml:exterior>\n                        <gml:LinearRing>\n                            <gml:posList>1693590.43 6513625.41 1693593.69 6513606.38 1693597.33 6513585.09 1693606.42 6513553.05 1693615.46 6513531.68 1693617.32 6513532.06 1693599.74 6513578.73 1693591.66 6513622.23 1693605.83 6513658.39 1693614.22 6513674.6 1693609.03 6513675.48 1693590.43 6513625.41</gml:posList>\n                        </gml:LinearRing>\n                    </gml:exterior>\n                </gml:Polygon>"
    }
]
