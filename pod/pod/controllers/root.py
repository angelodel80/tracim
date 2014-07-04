# -*- coding: utf-8 -*-
"""Main Controller"""
import pod

import tg
from tg import expose, flash, require, url, lurl, request, redirect, tmpl_context
from tg.i18n import ugettext as _, lazy_ugettext as l_
from tg import predicates
from pod.lib.auth import can_read

from pod.lib.base import BaseController
from pod.controllers.error import ErrorController

from pod.lib import dbapi as pld
from pod.controllers import api as pca
from pod.controllers import apipublic as pcap
from pod.controllers import debug as pbcd
from pod.controllers import adminuser as pbcu
from pod.controllers import admingroup as pbcg

from pod import model as pm

import pod.model.data as pbmd

__all__ = ['RootController']


class AdminController(BaseController):
    users = pbcu.AdminUserController(pm.DBSession)
    groups = pbcg.AdminGroupController(pm.DBSession)


class RootController(BaseController):
    """
    The root controller for the pod application.

    All the other controllers and WSGI applications should be mounted on this
    controller. For example::

        panel = ControlPanelController()
        another_app = AnotherWSGIApplication()

    Keep in mind that WSGI applications shouldn't be mounted directly: They
    must be wrapped around with :class:`tg.controllers.WSGIAppController`.

    """

    admin = AdminController()

    api   = pca.PODApiController()
    debug = pbcd.DebugController()
    error = ErrorController()

    public_api = pcap.PODPublicApiController()

    def _before(self, *args, **kw):
        tmpl_context.project_name = "pod"

    @expose('pod.templates.index')
    def index(self):
        """Handle the front-page."""
        return dict()


    @expose('pod.templates.about')
    def about(self):
        """Handle the about-page."""
        return dict()


    @expose('pod.templates.login')
    def login(self, came_from=lurl('/')):
        """Start the user login."""
        login_counter = request.environ.get('repoze.who.logins', 0)
        if login_counter > 0:
            flash(_('Wrong credentials'), 'warning')
        return dict(page='login', login_counter=str(login_counter),
                    came_from=came_from)

    @expose()
    def post_login(self, came_from=lurl('/')):
        """
        Redirect the user to the initially requested page on successful
        authentication or redirect her back to the login page if login failed.

        """
        if not request.identity:
            login_counter = request.environ.get('repoze.who.logins', 0) + 1
            redirect('/login',
                params=dict(came_from=came_from, __logins=login_counter))
        userid = request.identity['repoze.who.userid']
        flash(_('Welcome back, %s!') % userid)
        redirect(came_from)

    @expose()
    def post_logout(self, came_from=lurl('/')):
        """
        Redirect the user to the initially requested page on logout and say
        goodbye as well.

        """
        flash(_('We hope to see you soon!'))
        redirect(came_from)
        
    @expose('pod.templates.dashboard')
    @require(predicates.in_group('user', msg=l_('Please login to access this page')))
    def dashboard(self):
        loCurrentUser   = pld.PODStaticController.getCurrentUser()
        loApiController = pld.PODUserFilteredApiController(loCurrentUser.user_id)

        loLastModifiedNodes = loApiController.getLastModifiedNodes(10)
        loWhatsHotNodes     = loApiController.getNodesByStatus('hot', 5)
        loActionToDoNodes   = loApiController.getNodesByStatus('actiontodo', 5)
        return dict(last_modified_nodes=loLastModifiedNodes, whats_hot_nodes=loWhatsHotNodes, action_to_do_nodes = loActionToDoNodes)


    @expose('pod.templates.document')
    #@require(predicates.in_group('user', msg=l_('Please login to access this page')))
    @require(can_read())
    def document(self, node_id=0, version=0, came_from=lurl('/'), highlight=''):
        """show the user dashboard"""
        loCurrentUser   = pld.PODStaticController.getCurrentUser()
        loApiController = pld.PODUserFilteredApiController(loCurrentUser.user_id)

        llAccessibleNodes = loApiController.getListOfAllowedNodes()

        liNodeId         = int(node_id)
        liVersionId      = int(version)

        loCurrentNode    = None
        loNodeStatusList = None

        try:
          loNodeStatusList = pbmd.PBNodeStatus.getChoosableList()
          if liVersionId:
              row = dict(pm.DBSession.execute("select * from pod_nodes_history where node_id=:node_id and version_id=:version_id", {"node_id":liNodeId, "version_id":liVersionId}).first().items())
              del(row['version_id'])
              loCurrentNode = pbmd.PBNode(**row)
          else:
            loCurrentNode    = loApiController.getNode(liNodeId)
        except Exception as e:
          flash(_('Document not found'), 'error')

        user_specific_group_rights = pld.PODStaticController.getUserDedicatedGroupRightsOnNode(loCurrentNode)

        if node_id != 0:
            current_user_rights = pld.PODStaticController.DIRTY_get_rights_on_node(loCurrentUser.user_id, loCurrentNode.node_id)
            if loCurrentNode.owner_id == loCurrentUser.user_id:
                current_user_rights.rights = 3
        else:
            current_user_rights = None

        return dict(
            current_user=loCurrentUser,
            current_node=loCurrentNode,
            allowed_nodes=llAccessibleNodes,
            node_status_list = loNodeStatusList,
            keywords = highlight,
            user_specific_group_rights = user_specific_group_rights,
            real_group_rights = pld.PODStaticController.getRealGroupRightsOnNode(node_id),
            current_user_rights = current_user_rights
        )

    @expose('pod.templates.search')
    @require(predicates.in_group('user', msg=l_('Please login to access this page')))
    def search(self, keywords=''):
        loCurrentUser   = pld.PODStaticController.getCurrentUser()
        loApiController = pld.PODUserFilteredApiController(loCurrentUser.user_id)

        loFoundNodes = loApiController.searchNodesByText(keywords.split())

        return dict(search_string=keywords, found_nodes=loFoundNodes)

    @expose('pod.templates.create_account')
    def create_account(self):
        return dict()

