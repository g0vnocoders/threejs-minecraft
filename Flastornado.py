from tornado.wsgi import WSGIContainer
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
import tornado.log
import tornado.autoreload
from mainsrv import app
import logging
import os
import sys

print("\033[92mLOCAL WEB SERVER MODE\033[0m" if "local" in sys.argv else None)
tornado.autoreload.start()
tornado.log.access_log.setLevel(logging.INFO)

if "local" in sys.argv:
    http_server = HTTPServer(WSGIContainer(app))
    os.system('color 0')
    http_server.listen(80)
else:
    http_server = HTTPServer(WSGIContainer(app), ssl_options={
        # path to your SSL files
        "certfile": os.path.join("/etc/letsencrypt/live/sudohub.dev/fullchain.pem"),
        "keyfile": os.path.join("/etc/letsencrypt/live/sudohub.dev/privkey.pem"),
    })
    http_server.bind(443)
    http_server.start(num_processes=1)

IOLoop.instance().start()
