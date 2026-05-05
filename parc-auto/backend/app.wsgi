import sys
import os

sys.path.insert(0, '/var/www/parc-auto/backend')
os.environ['FLASK_ENV'] = 'production'

from run import app as application
