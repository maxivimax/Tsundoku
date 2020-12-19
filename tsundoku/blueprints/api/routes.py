import json
import logging

from quart import Blueprint
from quart import abort, current_app as app
from quart_auth import current_user

from .shows import ShowsAPI
from .entries import EntriesAPI
from .webhooks import WebhooksAPI
from .webhookbase import WebhookBaseAPI
from tsundoku.kitsu import KitsuManager


api_blueprint = Blueprint('api', __name__, url_prefix="/api")
logger = logging.getLogger("tsundoku")


@api_blueprint.before_request
async def ensure_auth():
    if not await current_user.is_authenticated:
        return abort(401, "You are not authorized to access this resource.")


@api_blueprint.route("/shows/seen", methods=["GET"])
async def get_seen_shows():
    """
    Returns a list of shows that the program
    has seen while scraping RSS feeds.

    Returns
    -------
    List[str]
    """
    return json.dumps(list(app.seen_titles))


@api_blueprint.route("/shows/check", methods=["GET"])
async def check_for_releases():
    """
    Forces Tsundoku to check for new releases.

    Returns
    -------
    List[Tuple(int, int)]
        A list of show IDs
    """
    logger.info("API - Force New Releases Check")

    found_items = []
    for parser in app.rss_parsers:
        feed = await app.poller.get_feed_from_parser(parser)

        logger.info(f"{parser.name} - Checking for New Releases...")
        found_items += await app.poller.check_feed(feed)
        logger.info(f"{parser.name} - Checked for New Releases")

    return json.dumps(found_items)


@api_blueprint.route("/shows/<int:show_id>/cache", methods=["DELETE"])
async def delete_show_cache(show_id: int):
    """
    Force Tsundoku to delete the cache for a show.

    Returns
    -------
    None
    """
    logger.info(f"API - Deleting cache for Show {show_id}")

    manager = await KitsuManager.from_show_id(show_id)
    await manager.clear_cache()

    return json.dumps([])


def setup_views():
    # Setup ShowsAPI URL rules.
    shows_view = ShowsAPI.as_view("shows_api")

    api_blueprint.add_url_rule(
        "/shows",
        defaults={
            "show_id": None
        },
        view_func=shows_view,
        methods=["GET", "POST"]
    )
    api_blueprint.add_url_rule(
        "/shows/<int:show_id>",
        view_func=shows_view,
        methods=["GET", "PUT", "DELETE"]
    )

    # Setup EntriesAPI URL rules.
    entries_view = EntriesAPI.as_view("entries_api")

    api_blueprint.add_url_rule(
        "/shows/<int:show_id>/entries",
        defaults={
            "entry_id": None
        },
        view_func=entries_view,
        methods=["GET", "POST"]
    )
    api_blueprint.add_url_rule(
        "/shows/<int:show_id>/entries/<int:entry_id>",
        view_func=entries_view,
        methods=["GET", "DELETE"]
    )

    # Setup WebhooksAPI URL rules.
    webhooks_view = WebhooksAPI.as_view("webhooks_api")

    api_blueprint.add_url_rule(
        "/shows/<int:show_id>/webhooks",
        view_func=webhooks_view,
        methods=["GET"]
    )
    api_blueprint.add_url_rule(
        "/shows/<int:show_id>/webhooks/<int:wh_id>",
        view_func=webhooks_view,
        methods=["GET", "PUT"]
    )

    # Setup WebhookBaseAPI URL rules.
    webhookbase_view = WebhookBaseAPI.as_view("webhookbase_api")

    api_blueprint.add_url_rule(
        "/webhooks",
        view_func=webhookbase_view,
        methods=["GET", "POST"]
    )
    api_blueprint.add_url_rule(
        "/webhooks/<int:base_id>",
        view_func=webhookbase_view,
        methods=["GET", "PUT", "DELETE"]
    )

setup_views()
