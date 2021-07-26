# Project Blackjack Visualization
Internship project with the [Real-Time Intelligent Systems Laboratory](http://rtis.oit.unlv.edu/) at the [University of Nevada, Las Vegas](https://www.unlv.edu/).

Interprets J2735-standard SPaT, MAP, and BSM data and displays it in real time

Grid view shows current traffic signal for each group according to the current configuration used by the City of Las Vegas with Cisco

Map view shows current traffic signal for each lane with positions, as well as positional history for BSM-equipped vehicles

# Installation
Designed to be used with Apache WSGI

Clone this repository into `/var/www/`

This should result in `/var/www/RTIS-Blackjack/static/grid.js` as a valid path

Run the following
```bash
$ sudo apt-get install libapache2-mod-wsgi
$ sudo a2enmod wsgi

$ sudo virtualenv venv
$ source venv/bin/activate

(venv)$ sudo pip install Flask
(venv)$ sudo pip install paho-mqtt
```

Add the following to your site configuration at `/etc/apache2/sites-available/[site].conf`
```
    WSGIDaemonProcess rtis-blackjack user=www-data group=www-data threads=5
    WSGIProcessGroup rtis-blackjack
    WSGIScriptAlias / /var/www/RTIS-Blackjack/rtis-blackjack.wsgi
    Alias /blackjack/static/ /var/www/RTIS-Blackjack/static
    <Directory /var/www/RTIS-Blackjack/static>
        Order allow,deny
        Allow from all
    </Directory>
```

Reload Apache
```bash
$ sudo /etc/init.d/apache2 reload
```
