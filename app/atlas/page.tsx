
"use client";

import { useMemo, useState } from "react";

type Place = {
  name: string;
  type: "Country" | "City" | "State / Province";
  country?: string;
};

const countriesText = `
Afghanistan,Albania,Algeria,Andorra,Angola,Antigua and Barbuda,
Argentina,Armenia,Australia,Austria,Azerbaijan,Bahamas,Bahrain,
Bangladesh,Barbados,Belarus,Belgium,Belize,Benin,Bhutan,Bolivia,
Bosnia and Herzegovina,Botswana,Brazil,Brunei,Bulgaria,Burkina Faso,
Burundi,Cabo Verde,Cambodia,Cameroon,Canada,Central African Republic,
Chad,Chile,China,Colombia,Comoros,Congo,Costa Rica,Croatia,Cuba,
Cyprus,Czechia,Democratic Republic of the Congo,Denmark,Djibouti,
Dominica,Dominican Republic,Ecuador,Egypt,El Salvador,Equatorial Guinea,
Eritrea,Estonia,Eswatini,Ethiopia,Fiji,Finland,France,Gabon,Gambia,
Georgia,Germany,Ghana,Greece,Grenada,Guatemala,Guinea,Guinea-Bissau,
Guyana,Haiti,Honduras,Hungary,Iceland,India,Indonesia,Iran,Iraq,
Ireland,Israel,Italy,Ivory Coast,Jamaica,Japan,Jordan,Kazakhstan,
Kenya,Kiribati,Kuwait,Kyrgyzstan,Laos,Latvia,Lebanon,Lesotho,Liberia,
Libya,Liechtenstein,Lithuania,Luxembourg,Madagascar,Malawi,Malaysia,
Maldives,Mali,Malta,Marshall Islands,Mauritania,Mauritius,Mexico,
Micronesia,Moldova,Monaco,Mongolia,Montenegro,Morocco,Mozambique,
Myanmar,Namibia,Nauru,Nepal,Netherlands,New Zealand,Nicaragua,Niger,
Nigeria,North Korea,North Macedonia,Norway,Oman,Pakistan,Palau,
Palestine,Panama,Papua New Guinea,Paraguay,Peru,Philippines,Poland,
Portugal,Qatar,Romania,Russia,Rwanda,Saint Kitts and Nevis,
Saint Lucia,Saint Vincent and the Grenadines,Samoa,San Marino,
Sao Tome and Principe,Saudi Arabia,Senegal,Serbia,Seychelles,
Sierra Leone,Singapore,Slovakia,Slovenia,Solomon Islands,Somalia,
South Africa,South Korea,South Sudan,Spain,Sri Lanka,Sudan,Suriname,
Sweden,Switzerland,Syria,Tajikistan,Tanzania,Thailand,Timor-Leste,
Togo,Tonga,Trinidad and Tobago,Tunisia,Turkey,Turkmenistan,Tuvalu,
Uganda,Ukraine,United Arab Emirates,United Kingdom,United States,
Uruguay,Uzbekistan,Vanuatu,Vatican City,Venezuela,Vietnam,Yemen,
Zambia,Zimbabwe
`;


const citiesText = `
Amsterdam|Netherlands
Athens|Greece
Auckland|New Zealand
Bangkok|Thailand
Barcelona|Spain
Beijing|China
Berlin|Germany
Birmingham|United Kingdom
Bogota|Colombia
Boston|United States
Brisbane|Australia
Brussels|Belgium
Buenos Aires|Argentina
Cairo|Egypt
Cape Town|South Africa
Chicago|United States
Copenhagen|Denmark
Dallas|United States
Delhi|India
Dhaka|Bangladesh
Doha|Qatar
Dubai|United Arab Emirates
Dublin|Ireland
Edinburgh|United Kingdom
Florence|Italy
Frankfurt|Germany
Geneva|Switzerland
Hanoi|Vietnam
Helsinki|Finland
Hong Kong|China
Honolulu|United States
Houston|United States
Hyderabad|India
Istanbul|Turkey
Jakarta|Indonesia
Jaipur|India
Jeddah|Saudi Arabia
Jerusalem|Palestine
Johannesburg|South Africa
Kabul|Afghanistan
Karachi|Pakistan
Kathmandu|Nepal
Kolkata|India
Kuala Lumpur|Malaysia
Kyoto|Japan
Lagos|Nigeria
Las Vegas|United States
Lahore|Pakistan
Lima|Peru
Lisbon|Portugal
London|United Kingdom
Los Angeles|United States
Madrid|Spain
Manila|Philippines
Melbourne|Australia
Miami|United States
Milan|Italy
Montreal|Canada
Moscow|Russia
Mumbai|India
Munich|Germany
Nairobi|Kenya
Naples|Italy
New Delhi|India
New York|United States
Nice|France
Osaka|Japan
Oslo|Norway
Ottawa|Canada
Paris|France
Perth|Australia
Prague|Czechia
Pune|India
Reykjavik|Iceland
Rio de Janeiro|Brazil
Riyadh|Saudi Arabia
Rome|Italy
San Diego|United States
San Francisco|United States
Santiago|Chile
Sao Paulo|Brazil
Seattle|United States
Seoul|South Korea
Shanghai|China
Singapore|Singapore
Stockholm|Sweden
Sydney|Australia
Taipei|Taiwan
Tallinn|Estonia
Tehran|Iran
Tokyo|Japan
Toronto|Canada
Venice|Italy
Vienna|Austria
Warsaw|Poland
Washington|United States
Wellington|New Zealand
Zurich|Switzerland

# INDIA
Agra|India
Ahmedabad|India
Ajmer|India
Aligarh|India
Amritsar|India
Aurangabad|India
Bareilly|India
Belgaum|India
Bengaluru|India
Bhopal|India
Bhubaneswar|India
Bikaner|India
Bilaspur|India
Chandigarh|India
Chennai|India
Coimbatore|India
Cuttack|India
Dehradun|India
Dhanbad|India
Dharamshala|India
Durgapur|India
Erode|India
Faridabad|India
Firozabad|India
Gandhinagar|India
Ghaziabad|India
Gorakhpur|India
Guntur|India
Gurugram|India
Guwahati|India
Gwalior|India
Haridwar|India
Hisar|India
Imphal|India
Indore|India
Jabalpur|India
Jalandhar|India
Jammu|India
Jamnagar|India
Jamshedpur|India
Jhansi|India
Jodhpur|India
Kannur|India
Kanpur|India
Kochi|India
Kohima|India
Kolhapur|India
Kota|India
Kozhikode|India
Kurnool|India
Leh|India
Lucknow|India
Ludhiana|India
Madurai|India
Mangalore|India
Meerut|India
Moradabad|India
Mysuru|India
Nagpur|India
Nashik|India
Navi Mumbai|India
Nellore|India
Noida|India
Panaji|India
Patiala|India
Patna|India
Prayagraj|India
Puducherry|India
Raipur|India
Rajkot|India
Ranchi|India
Rourkela|India
Salem|India
Shimla|India
Siliguri|India
Srinagar|India
Surat|India
Thane|India
Thiruvananthapuram|India
Thrissur|India
Tiruchirappalli|India
Tirupati|India
Udaipur|India
Ujjain|India
Vadodara|India
Varanasi|India
Vijayawada|India
Visakhapatnam|India
Warangal|India

# PAKISTAN
Abbottabad|Pakistan
Bahawalpur|Pakistan
Faisalabad|Pakistan
Gujranwala|Pakistan
Gujrat|Pakistan
Hyderabad|Pakistan
Islamabad|Pakistan
Kasur|Pakistan
Larkana|Pakistan
Multan|Pakistan
Murree|Pakistan
Peshawar|Pakistan
Quetta|Pakistan
Rawalpindi|Pakistan
Sialkot|Pakistan
Sukkur|Pakistan

# BANGLADESH
Barisal|Bangladesh
Bogra|Bangladesh
Chittagong|Bangladesh
Comilla|Bangladesh
Cox's Bazar|Bangladesh
Gazipur|Bangladesh
Khulna|Bangladesh
Mymensingh|Bangladesh
Rajshahi|Bangladesh
Rangpur|Bangladesh
Sylhet|Bangladesh

# NEPAL
Biratnagar|Nepal
Birgunj|Nepal
Butwal|Nepal
Dharan|Nepal
Janakpur|Nepal
Lalitpur|Nepal
Pokhara|Nepal
Bharatpur|Nepal

# SRI LANKA
Anuradhapura|Sri Lanka
Batticaloa|Sri Lanka
Galle|Sri Lanka
Jaffna|Sri Lanka
Kandy|Sri Lanka
Negombo|Sri Lanka
Trincomalee|Sri Lanka

# CHINA
Changchun|China
Changsha|China
Chengdu|China
Dalian|China
Dongguan|China
Foshan|China
Fuzhou|China
Guiyang|China
Hangzhou|China
Harbin|China
Hefei|China
Jinan|China
Kunming|China
Lanzhou|China
Nanchang|China
Nanjing|China
Nanning|China
Nantong|China
Qingdao|China
Shenyang|China
Shenzhen|China
Shijiazhuang|China
Suzhou|China
Taiyuan|China
Tangshan|China
Tianjin|China
Urumqi|China
Wenzhou|China
Wuhan|China
Wuxi|China
Xiamen|China
Xi'an|China
Xining|China
Yantai|China
Yinchuan|China
Zhengzhou|China
Zhuhai|China

# JAPAN
Fukuoka|Japan
Hiroshima|Japan
Kobe|Japan
Kumamoto|Japan
Nagoya|Japan
Naha|Japan
Nagasaki|Japan
Niigata|Japan
Okayama|Japan
Sapporo|Japan
Sendai|Japan
Shizuoka|Japan
Takayama|Japan
Yokohama|Japan

# SOUTH KOREA
Busan|South Korea
Daegu|South Korea
Daejeon|South Korea
Gwangju|South Korea
Incheon|South Korea
Jeju City|South Korea
Suwon|South Korea
Ulsan|South Korea

# SOUTHEAST ASIA
Bandung|Indonesia
Denpasar|Indonesia
Makassar|Indonesia
Medan|Indonesia
Palembang|Indonesia
Semarang|Indonesia
Surabaya|Indonesia
Yogyakarta|Indonesia
Chiang Mai|Thailand
Chiang Rai|Thailand
Hat Yai|Thailand
Pattaya|Thailand
Phuket|Thailand
Ayutthaya|Thailand
Can Tho|Vietnam
Da Nang|Vietnam
Da Lat|Vietnam
Hai Phong|Vietnam
Hue|Vietnam
Hoi An|Vietnam
Ho Chi Minh City|Vietnam
Nha Trang|Vietnam
Phu Quoc|Vietnam
Vung Tau|Vietnam
Cebu City|Philippines
Davao City|Philippines
Iloilo City|Philippines
Quezon City|Philippines
Tagaytay|Philippines
Vigan|Philippines
George Town|Malaysia
Johor Bahru|Malaysia
Kota Kinabalu|Malaysia
Kuching|Malaysia
Malacca City|Malaysia
Ipoh|Malaysia
Putrajaya|Malaysia
Bandar Seri Begawan|Brunei
Phnom Penh|Cambodia
Siem Reap|Cambodia
Sihanoukville|Cambodia
Vientiane|Laos
Luang Prabang|Laos
Yangon|Myanmar
Mandalay|Myanmar
Naypyidaw|Myanmar
Dili|Timor-Leste

# MIDDLE EAST
Abu Dhabi|United Arab Emirates
Ajman|United Arab Emirates
Al Ain|United Arab Emirates
Sharjah|United Arab Emirates
Kuwait City|Kuwait
Manama|Bahrain
Muscat|Oman
Salalah|Oman
Amman|Jordan
Aqaba|Jordan
Beirut|Lebanon
Tripoli|Lebanon
Baghdad|Iraq
Basra|Iraq
Erbil|Iraq
Mosul|Iraq
Damascus|Syria
Aleppo|Syria
Latakia|Syria
Ankara|Turkey
Antalya|Turkey
Bursa|Turkey
Gaziantep|Turkey
Izmir|Turkey
Konya|Turkey
Trabzon|Turkey
Adana|Turkey
Baku|Azerbaijan
Yerevan|Armenia
Tbilisi|Georgia
Ashgabat|Turkmenistan
Dushanbe|Tajikistan
Bishkek|Kyrgyzstan
Almaty|Kazakhstan
Astana|Kazakhstan
Samarkand|Uzbekistan
Tashkent|Uzbekistan
Herat|Afghanistan
Kandahar|Afghanistan
Mazar-i-Sharif|Afghanistan
Mashhad|Iran
Isfahan|Iran
Shiraz|Iran
Tabriz|Iran
Ahvaz|Iran
Jubail|Saudi Arabia
Mecca|Saudi Arabia
Medina|Saudi Arabia
Dammam|Saudi Arabia
Taif|Saudi Arabia
Abha|Saudi Arabia
Yanbu|Saudi Arabia
Tel Aviv|Israel
Haifa|Israel
Eilat|Israel
Ramallah|Palestine
Gaza City|Palestine

# EUROPE
Antwerp|Belgium
Bruges|Belgium
Ghent|Belgium
Liege|Belgium
Sofia|Bulgaria
Plovdiv|Bulgaria
Varna|Bulgaria
Dubrovnik|Croatia
Split|Croatia
Zagreb|Croatia
Brno|Czechia
Ostrava|Czechia
Aarhus|Denmark
Odense|Denmark
Tartu|Estonia
Turku|Finland
Tampere|Finland
Lyon|France
Marseille|France
Bordeaux|France
Lille|France
Nantes|France
Strasbourg|France
Toulouse|France
Montpellier|France
Cannes|France
Grenoble|France
Dresden|Germany
Dusseldorf|Germany
Cologne|Germany
Hamburg|Germany
Leipzig|Germany
Stuttgart|Germany
Nuremberg|Germany
Bonn|Germany
Dortmund|Germany
Essen|Germany
Gothenburg|Sweden
Malmo|Sweden
Uppsala|Sweden
Bergen|Norway
Trondheim|Norway
Stavanger|Norway
Gdansk|Poland
Krakow|Poland
Lodz|Poland
Poznan|Poland
Wroclaw|Poland
Gothenburg|Sweden
Basel|Switzerland
Bern|Switzerland
Lausanne|Switzerland
Lucerne|Switzerland
Lugano|Switzerland
Antwerp|Belgium
Rotterdam|Netherlands
The Hague|Netherlands
Utrecht|Netherlands
Eindhoven|Netherlands
Groningen|Netherlands
Porto|Portugal
Faro|Portugal
Coimbra|Portugal
Braga|Portugal
Seville|Spain
Valencia|Spain
Malaga|Spain
Bilbao|Spain
Granada|Spain
Zaragoza|Spain
Alicante|Spain
Cordoba|Spain
Toledo|Spain
Palma de Mallorca|Spain
Salamanca|Spain
Bologna|Italy
Turin|Italy
Genoa|Italy
Verona|Italy
Bari|Italy
Palermo|Italy
Catania|Italy
Pisa|Italy
Siena|Italy
Bergamo|Italy
Trieste|Italy
Padua|Italy
Perugia|Italy
Bucharest|Romania
Cluj-Napoca|Romania
Timisoara|Romania
Brasov|Romania
Sibiu|Romania
Belgrade|Serbia
Novi Sad|Serbia
Sarajevo|Bosnia and Herzegovina
Mostar|Bosnia and Herzegovina
Ljubljana|Slovenia
Maribor|Slovenia
Bratislava|Slovakia
Kosice|Slovakia
Skopje|North Macedonia
Tirana|Albania
Pristina|Kosovo
Podgorica|Montenegro
Kotor|Montenegro
Chisinau|Moldova
Kyiv|Ukraine
Lviv|Ukraine
Odesa|Ukraine
Kharkiv|Ukraine
Dnipro|Ukraine
Minsk|Belarus
Vilnius|Lithuania
Kaunas|Lithuania
Riga|Latvia
Daugavpils|Latvia
Budapest|Hungary
Debrecen|Hungary
Pecs|Hungary
Warsaw|Poland
Athens|Greece
Thessaloniki|Greece
Patras|Greece
Heraklion|Greece
Rhodes|Greece
Limassol|Cyprus
Nicosia|Cyprus
Paphos|Cyprus
Reims|France
Rouen|France
Oxford|United Kingdom
Cambridge|United Kingdom
Manchester|United Kingdom
Liverpool|United Kingdom
Leeds|United Kingdom
Bristol|United Kingdom
Glasgow|United Kingdom
Cardiff|United Kingdom
Belfast|United Kingdom
Newcastle|United Kingdom
Nottingham|United Kingdom
Sheffield|United Kingdom
Leicester|United Kingdom
Brighton|United Kingdom
York|United Kingdom
Bath|United Kingdom
Aberdeen|United Kingdom
Dundee|United Kingdom
Inverness|United Kingdom
Swansea|United Kingdom
Coventry|United Kingdom
Southampton|United Kingdom
Portsmouth|United Kingdom
Reading|United Kingdom
Milton Keynes|United Kingdom

# NORTH AMERICA
Atlanta|United States
Austin|United States
Baltimore|United States
Charlotte|United States
Cincinnati|United States
Cleveland|United States
Columbus|United States
Denver|United States
Detroit|United States
El Paso|United States
Indianapolis|United States
Jacksonville|United States
Kansas City|United States
Louisville|United States
Memphis|United States
Milwaukee|United States
Minneapolis|United States
Nashville|United States
New Orleans|United States
Oklahoma City|United States
Orlando|United States
Philadelphia|United States
Phoenix|United States
Pittsburgh|United States
Portland|United States
Raleigh|United States
Sacramento|United States
Salt Lake City|United States
San Antonio|United States
San Jose|United States
Tampa|United States
Tucson|United States
Tulsa|United States
Virginia Beach|United States
Albuquerque|United States
Anchorage|United States
Baton Rouge|United States
Boise|United States
Buffalo|United States
Charleston|United States
Colorado Springs|United States
Des Moines|United States
Fresno|United States
Honolulu|United States
Little Rock|United States
Madison|United States
Omaha|United States
Richmond|United States
Reno|United States
Spokane|United States
St. Louis|United States
Wichita|United States
Albany|United States
Burlington|United States
Fort Worth|United States
Grand Rapids|United States
Hartford|United States
Jersey City|United States
Long Beach|United States
Oakland|United States
Santa Fe|United States
Savannah|United States
Toledo|United States
Vancouver|Canada
Calgary|Canada
Edmonton|Canada
Quebec City|Canada
Winnipeg|Canada
Halifax|Canada
Victoria|Canada
Saskatoon|Canada
Regina|Canada
Hamilton|Canada
London|Canada
Kitchener|Canada
St. John's|Canada
Kelowna|Canada
Yellowknife|Canada
Iqaluit|Canada
Charlottetown|Canada
Fredericton|Canada
Moncton|Canada
Quezon City|Philippines
Guadalajara|Mexico
Monterrey|Mexico
Puebla|Mexico
Tijuana|Mexico
Leon|Mexico
Merida|Mexico
Oaxaca City|Mexico
San Luis Potosi|Mexico
Hermosillo|Mexico
Acapulco|Mexico
Cancun|Mexico
Chihuahua City|Mexico
Veracruz|Mexico
Tuxtla Gutierrez|Mexico
Morelia|Mexico
Toluca|Mexico
Torreon|Mexico
Ensenada|Mexico
Campeche|Mexico
Antigua Guatemala|Guatemala
Guatemala City|Guatemala
San Salvador|El Salvador
San Pedro Sula|Honduras
Tegucigalpa|Honduras
Managua|Nicaragua
Leon|Nicaragua
San Jose|Costa Rica
Panama City|Panama
David|Panama
Havana|Cuba
Santiago de Cuba|Cuba
Varadero|Cuba
Santo Domingo|Dominican Republic
Santiago de los Caballeros|Dominican Republic
Port-au-Prince|Haiti
Kingston|Jamaica
Montego Bay|Jamaica
Nassau|Bahamas
Bridgetown|Barbados
Port of Spain|Trinidad and Tobago
Scarborough|Trinidad and Tobago
Castries|Saint Lucia
St. George's|Grenada
Belmopan|Belize
Georgetown|Guyana
Paramaribo|Suriname

# SOUTH AMERICA
Arequipa|Peru
Cusco|Peru
Trujillo|Peru
Iquitos|Peru
Guayaquil|Ecuador
Quito|Ecuador
Cuenca|Ecuador
La Paz|Bolivia
Sucre|Bolivia
Santa Cruz de la Sierra|Bolivia
Medellin|Colombia
Cali|Colombia
Cartagena|Colombia
Barranquilla|Colombia
Bucaramanga|Colombia
Pereira|Colombia
Cordoba|Argentina
Rosario|Argentina
Mendoza|Argentina
Mar del Plata|Argentina
Salta|Argentina
Ushuaia|Argentina
Valparaiso|Chile
Concepcion|Chile
Antofagasta|Chile
Vina del Mar|Chile
La Serena|Chile
Montevideo|Uruguay
Punta del Este|Uruguay
Asuncion|Paraguay
Ciudad del Este|Paraguay
Brasilia|Brazil
Salvador|Brazil
Fortaleza|Brazil
Recife|Brazil
Manaus|Brazil
Belem|Brazil
Goiania|Brazil
Curitiba|Brazil
Porto Alegre|Brazil
Florianopolis|Brazil
Natal|Brazil
Maceio|Brazil
Joao Pessoa|Brazil
Campinas|Brazil
Santos|Brazil
Vitoria|Brazil
Cuiaba|Brazil
Campo Grande|Brazil
Macapa|Brazil
Boa Vista|Brazil
Porto Velho|Brazil
Rio Branco|Brazil
Maracaibo|Venezuela
Caracas|Venezuela
Valencia|Venezuela
Merida|Venezuela
Barquisimeto|Venezuela
Ciudad Guayana|Venezuela
Paramaribo|Suriname

# AFRICA
Accra|Ghana
Addis Ababa|Ethiopia
Alexandria|Egypt
Algiers|Algeria
Asmara|Eritrea
Bamako|Mali
Banjul|Gambia
Bissau|Guinea-Bissau
Blantyre|Malawi
Brazzaville|Republic of the Congo
Bujumbura|Burundi
Conakry|Guinea
Dakar|Senegal
Dar es Salaam|Tanzania
Djibouti City|Djibouti
Douala|Cameroon
Freetown|Sierra Leone
Gaborone|Botswana
Harare|Zimbabwe
Kampala|Uganda
Kigali|Rwanda
Kinshasa|Democratic Republic of the Congo
Lome|Togo
Luanda|Angola
Lubumbashi|Democratic Republic of the Congo
Lusaka|Zambia
Maputo|Mozambique
Maseru|Lesotho
Mogadishu|Somalia
Monrovia|Liberia
N'Djamena|Chad
Niamey|Niger
Nouakchott|Mauritania
Ouagadougou|Burkina Faso
Port Louis|Mauritius
Porto-Novo|Benin
Pretoria|South Africa
Rabat|Morocco
Sanaa|Yemen
Tripoli|Libya
Tunis|Tunisia
Windhoek|Namibia
Yaounde|Cameroon
Abidjan|Ivory Coast
Benghazi|Libya
Bobo-Dioulasso|Burkina Faso
Bujumbura|Burundi
Butare|Rwanda
Casablanca|Morocco
Fez|Morocco
Marrakesh|Morocco
Tangier|Morocco
Agadir|Morocco
Oran|Algeria
Constantine|Algeria
Annaba|Algeria
Sfax|Tunisia
Sousse|Tunisia
Luxor|Egypt
Aswan|Egypt
Giza|Egypt
Hurghada|Egypt
Sharm El Sheikh|Egypt
Kumasi|Ghana
Tamale|Ghana
Mombasa|Kenya
Kisumu|Kenya
Nakuru|Kenya
Arusha|Tanzania
Dodoma|Tanzania
Mwanza|Tanzania
Zanzibar City|Tanzania
Entebbe|Uganda
Jinja|Uganda
Bulawayo|Zimbabwe
Mutare|Zimbabwe
Kitwe|Zambia
Ndola|Zambia
Livingstone|Zambia
Lilongwe|Malawi
Beira|Mozambique
Nampula|Mozambique
Tete|Mozambique
Antananarivo|Madagascar
Toamasina|Madagascar
Fianarantsoa|Madagascar
Moroni|Comoros
Victoria|Seychelles
Praia|Cabo Verde
Mindelo|Cabo Verde
Malabo|Equatorial Guinea
Bata|Equatorial Guinea
Libreville|Gabon
Port-Gentil|Gabon
Bangui|Central African Republic
Moundou|Chad
Garoua|Cameroon
Kankan|Guinea
Labé|Guinea
Saint-Louis|Senegal
Touba|Senegal
Thiès|Senegal
Ziguinchor|Senegal
Serekunda|Gambia
Koidu|Sierra Leone
Bo|Sierra Leone
Gbarnga|Liberia
Kankan|Guinea
Bobo-Dioulasso|Burkina Faso

# OCEANIA
Adelaide|Australia
Canberra|Australia
Darwin|Australia
Gold Coast|Australia
Hobart|Australia
Newcastle|Australia
Townsville|Australia
Wollongong|Australia
Geelong|Australia
Cairns|Australia
Toowoomba|Australia
Launceston|Australia
Bunbury|Australia
Ballarat|Australia
Bendigo|Australia
Alice Springs|Australia
Suva|Fiji
Nadi|Fiji
Lautoka|Fiji
Apia|Samoa
Nuku'alofa|Tonga
Port Moresby|Papua New Guinea
Lae|Papua New Guinea
Madang|Papua New Guinea
Honiara|Solomon Islands
Port Vila|Vanuatu
Majuro|Marshall Islands
Tarawa|Kiribati
Palikir|Micronesia
Yaren|Nauru
Funafuti|Tuvalu
Pago Pago|American Samoa
Papeete|French Polynesia
Noumea|New Caledonia
Christchurch|New Zealand
Hamilton|New Zealand
Dunedin|New Zealand
Tauranga|New Zealand
Queenstown|New Zealand
Rotorua|New Zealand
Napier|New Zealand
Nelson|New Zealand
Invercargill|New Zealand
Whangarei|New Zealand
`;


const subdivisions: Record<string, string> = {
  India: `Andhra Pradesh,Arunachal Pradesh,Assam,Bihar,Chhattisgarh,Goa,Gujarat,Haryana,Himachal Pradesh,Jharkhand,Karnataka,Kerala,Madhya Pradesh,Maharashtra,Manipur,Meghalaya,Mizoram,Nagaland,Odisha,Punjab,Rajasthan,Sikkim,Tamil Nadu,Telangana,Tripura,Uttar Pradesh,Uttarakhand,West Bengal,Delhi,Jammu and Kashmir,Ladakh`,
  "United States": `Alabama,Alaska,Arizona,Arkansas,California,Colorado,Connecticut,Delaware,Florida,Georgia,Hawaii,Idaho,Illinois,Indiana,Iowa,Kansas,Kentucky,Louisiana,Maine,Maryland,Massachusetts,Michigan,Minnesota,Mississippi,Missouri,Montana,Nebraska,Nevada,New Hampshire,New Jersey,New Mexico,New York,North Carolina,North Dakota,Ohio,Oklahoma,Oregon,Pennsylvania,Rhode Island,South Carolina,South Dakota,Tennessee,Texas,Utah,Vermont,Virginia,Washington,West Virginia,Wisconsin,Wyoming`,
  Canada: `Alberta,British Columbia,Manitoba,New Brunswick,Newfoundland and Labrador,Nova Scotia,Ontario,Prince Edward Island,Quebec,Saskatchewan,Yukon`,
  Australia: `New South Wales,Queensland,South Australia,Tasmania,Victoria,Western Australia`,
  Germany: `Bavaria,Berlin,Brandenburg,Bremen,Hamburg,Hesse,Lower Saxony,Mecklenburg-Vorpommern,North Rhine-Westphalia,Rhineland-Palatinate,Saarland,Saxony,Saxony-Anhalt,Schleswig-Holstein,Thuringia`,
  Brazil: `Acre,Alagoas,Amapa,Amazonas,Bahia,Ceara,Espirito Santo,Goias,Maranhao,Mato Grosso,Mato Grosso do Sul,Minas Gerais,Para,Paraiba,Parana,Pernambuco,Piaui,Rio de Janeiro,Rio Grande do Norte,Rio Grande do Sul,Rondonia,Roraima,Santa Catarina,Sao Paulo,Sergipe,Tocantins`,
  Mexico: `Aguascalientes,Baja California,Campeche,Chiapas,Chihuahua,Coahuila,Colima,Durango,Guanajuato,Guerrero,Hidalgo,Jalisco,Mexico City,Michoacan,Morelos,Nayarit,Nuevo Leon,Oaxaca,Puebla,Queretaro,Quintana Roo,San Luis Potosi,Sinaloa,Sonora,Tabasco,Tamaulipas,Tlaxcala,Veracruz,Yucatan,Zacatecas`,
  Pakistan: `Balochistan,Khyber Pakhtunkhwa,Punjab,Sindh`,
  China: `Anhui,Beijing,Chongqing,Fujian,Gansu,Guangdong,Guangxi,Guizhou,Hainan,Hebei,Heilongjiang,Henan,Hong Kong,Hubei,Hunan,Inner Mongolia,Jiangsu,Jiangxi,Jilin,Liaoning,Macao,Ningxia,Qinghai,Shaanxi,Shandong,Shanghai,Shanxi,Sichuan,Tianjin,Tibet,Xinjiang,Yunnan,Zhejiang`,
  Japan: `Aichi,Akita,Aomori,Chiba,Fukui,Fukuoka,Fukushima,Gifu,Gunma,Hiroshima,Hokkaido,Hyogo,Ibaraki,Ishikawa,Iwate,Kagawa,Kagoshima,Kanagawa,Kochi,Kumamoto,Kyoto,Mie,Miyagi,Miyazaki,Nagano,Nagasaki,Nara,Niigata,Oita,Okayama,Okinawa,Osaka,Saga,Saitama,Shiga,Shimane,Shizuoka,Tochigi,Tokushima,Tokyo,Tottori,Toyama,Wakayama,Yamagata,Yamaguchi,Yamanashi`,
  France: `Auvergne-Rhone-Alpes,Brittany,Burgundy,Grand Est,Normandy,Occitanie,Paris,Provence-Alpes-Cote d'Azur`,
  Italy: `Abruzzo,Apulia,Calabria,Campania,Lazio,Liguria,Lombardy,Marche,Piedmont,Sardinia,Sicily,Tuscany,Umbria,Veneto`,
  Russia: `Adygea,Altai,Amur,Arkhangelsk,Bashkortostan,Buryatia,Chechnya,Chukotka,Dagestan,Ingushetia,Irkutsk,Kaliningrad,Kamchatka,Karelia,Khabarovsk,Krasnodar,Krasnoyarsk,Moscow,Novosibirsk,Sakha,Sakhalin,Tatarstan,Tver,Yakutia`,
  "South Africa": `Eastern Cape,Free State,Gauteng,KwaZulu-Natal,Limpopo,Mpumalanga,North West,Northern Cape,Western Cape`,
  Spain: `Andalusia,Aragon,Asturias,Balearic Islands,Basque Country,Canary Islands,Cantabria,Catalonia,Galicia,La Rioja,Madrid,Murcia,Navarre,Valencia`,
  Argentina: `Buenos Aires,Catamarca,Chaco,Chubut,Cordoba,Corrientes,Entre Rios,Formosa,Jujuy,La Pampa,La Rioja,Mendoza,Misiones,Neuquen,Salta,San Juan,San Luis,Santa Cruz,Santa Fe,Santiago del Estero,Tierra del Fuego,Tucuman`,
  Nigeria: `Abia,Adamawa,Akwa Ibom,Anambra,Bauchi,Bayelsa,Benue,Borno,Cross River,Delta,Ebonyi,Edo,Ekiti,Enugu,Gombe,Imo,Jigawa,Kaduna,Kano,Katsina,Kebbi,Kogi,Kwara,Lagos,Nasarawa,Niger,Ogun,Ondo,Osun,Oyo,Plateau,Rivers,Sokoto,Taraba,Yobe,Zamfara`,
};

const countries: Place[] = countriesText
  .split(",")
  .map((name) => name.trim())
  .filter(Boolean)
  .map((name) => ({ name, type: "Country" }));

const cities: Place[] = citiesText
  .trim()
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const [name, country] = line.split("|");
    return { name, country, type: "City" };
  });

const states: Place[] = Object.entries(subdivisions).flatMap(
  ([country, names]) =>
    names.split(",").map((name) => ({
      name: name.trim(),
      country,
      type: "State / Province" as const,
    }))
);

const allPlaces: Place[] = [
  ...countries,
  ...cities,
  ...states,
].filter(
  (place, index, array) =>
    array.findIndex(
      (other) =>
        other.name.toLowerCase() === place.name.toLowerCase() &&
        other.type === place.type &&
        other.country === place.country
    ) === index
);

const categories = ["All", "Country", "City", "State / Province"] as const;

export default function AtlasPage() {
  const [letter, setLetter] = useState("");
  const [category, setCategory] =
    useState<(typeof categories)[number]>("All");
  const [used, setUsed] = useState<string[]>([]);
  const [showUsed, setShowUsed] = useState(false);

  const suggestions = useMemo(() => {
    const query = letter.trim().toLowerCase();

    return allPlaces
      .filter((place) => place.name.toLowerCase().startsWith(query))
      .filter((place) => category === "All" || place.type === category)
      .filter((place) => !used.includes(placeKey(place)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [letter, category, used]);

  function placeKey(place: Place) {
    return `${place.type}|${place.country ?? ""}|${place.name}`;
  }

  function toggleUsed(place: Place) {
    const key = placeKey(place);
    setUsed((previous) =>
      previous.includes(key)
        ? previous.filter((item) => item !== key)
        : [...previous, key]
    );
  }

  function resetRound() {
    setUsed([]);
    setLetter("");
    setShowUsed(false);
  }

  const usedPlaces = allPlaces.filter((place) =>
    used.includes(placeKey(place))
  );

  return (
    <main className="min-h-screen bg-[#090a0b] text-zinc-100">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-16">
        <header className="mb-12 flex items-center justify-between">
          <a href="/atlas" className="text-lg font-black tracking-[0.2em]">
            ATLAS<span className="text-lime-400">.</span>
          </a>
          <span className="rounded-full border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400">
            OFFLINE DATABASE
          </span>
        </header>

        <section className="mb-10">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-lime-400">
            Your geography advantage
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            Own the <span className="text-zinc-500">next letter.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">
            Enter a starting letter. Find a place. Tick it off when you have
            used it, and it disappears from your suggestions.
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-[#101112] p-5 sm:p-7">
          <label
            htmlFor="atlas-letter"
            className="mb-3 block text-xs font-bold uppercase tracking-widest text-zinc-400"
          >
            Starting letter
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="atlas-letter"
              value={letter}
              onChange={(event) =>
                setLetter(event.target.value.slice(0, 1).toUpperCase())
              }
              maxLength={1}
              placeholder="e.g. N"
              autoComplete="off"
              className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-[#090a0b] px-5 py-4 text-2xl font-semibold uppercase outline-none transition placeholder:text-zinc-700 focus:border-lime-400"
            />

            <button
              onClick={() => {
                setLetter("");
                document.getElementById("atlas-letter")?.focus();
              }}
              className="rounded-xl border border-zinc-700 px-5 py-3 text-sm text-zinc-300 transition hover:bg-zinc-800"
            >
              Clear letter
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                  category === item
                    ? "bg-lime-400 text-black"
                    : "border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                {letter ? `Suggestions for ${letter}` : "All places"}
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                {suggestions.length} available
                {used.length > 0 && ` · ${used.length} marked as used`}
              </p>
            </div>

            <button
              onClick={() => setShowUsed((value) => !value)}
              className="text-sm text-lime-400 hover:text-lime-300"
            >
              {showUsed ? "Hide used" : `Used this round (${used.length})`}
            </button>
          </div>

          {showUsed && (
            <div className="mb-5 rounded-xl border border-zinc-800 bg-[#101112] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium">Already played</h3>
                <button
                  onClick={resetRound}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Reset round
                </button>
              </div>

              {usedPlaces.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  Nothing marked yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {usedPlaces.map((place) => (
                    <label
                      key={placeKey(place)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg bg-black/30 p-3 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked
                        onChange={() => toggleUsed(place)}
                        className="accent-lime-400"
                      />
                      <span className="flex-1">{place.name}</span>
                      <span className="text-xs text-zinc-500">
                        {place.type}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {!letter ? (
            <div className="rounded-xl border border-dashed border-zinc-800 px-5 py-12 text-center">
              <p className="text-zinc-400">
                Enter a letter to reveal your options.
              </p>
              <p className="mt-2 text-xs text-zinc-600">
                Countries · Cities · States & provinces
              </p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 p-8 text-center text-sm text-zinc-500">
              No unused places found for this letter in the selected category.
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {suggestions.map((place) => (
                <label
                  key={placeKey(place)}
                  className="group flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-800 bg-[#101112] p-4 transition hover:border-zinc-600 hover:bg-[#151617]"
                >
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => toggleUsed(place)}
                    className="h-4 w-4 shrink-0 accent-lime-400"
                    aria-label={`Mark ${place.name} as used`}
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{place.name}</span>
                    <span className="mt-1 block text-xs text-zinc-500">
                      {place.type}
                      {place.country && ` · ${place.country}`}
                    </span>
                  </span>

                  <span className="text-xs text-zinc-600 transition group-hover:text-lime-400">
                    TICK ↗
                  </span>
                </label>
              ))}
            </div>
          )}
        </section>

        <footer className="mt-14 border-t border-zinc-900 pt-5 text-xs leading-5 text-zinc-600">
          ATLAS EDGE · Built for quick rounds. Names are suggestions, not a
          guarantee that your game's rules accept every entry. Checked items
          remain saved only while this page stays open.
        </footer>
      </div>
    </main>
  );
}