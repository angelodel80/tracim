# -*- coding: utf-8 -*-
import typing

from bs4 import Tag, NavigableString


class ProprietaryHTMLAttrValues(object):
    """
    This are all Proprietary (mail client specific) html attr value we need to
    check Html Elements
    """
    # Gmail
    Gmail_extras_class = 'gmail_extra'
    Gmail_quote_class = 'gmail_quote'
    Gmail_signature_class = 'gmail_signature'
    # Thunderbird
    Thunderbird_quote_prefix_class = 'moz-cite-prefix'
    Thunderbird_signature_class = 'moz-signature'
    # Outlook.com
    Outlook_com_quote_id = 'divRplyFwdMsg'
    Outlook_com_signature_id = 'Signature'
    Outlook_com_wrapper_id = 'divtagdefaultwrapper'
    # Yahoo
    Yahoo_quote_class = 'yahoo_quoted'
    # Roundcube
    # INFO - G.M - 2017-11-29 - New tag
    # see : https://github.com/roundcube/roundcubemail/issues/6049
    Roundcube_quote_prefix_class = 'reply-intro'


class HtmlChecker(object):

    @classmethod
    def _has_attr_value(
            cls,
            elem: typing.Union[Tag, NavigableString],
            attribute_name: str,
            attribute_value: str,
    )-> bool:
        if isinstance(elem, Tag) and \
                        attribute_name in elem.attrs and \
                        attribute_value in elem.attrs[attribute_name]:
            return True
        return False


class HtmlMailQuoteChecker(HtmlChecker):

    @classmethod
    def is_quote(
            cls,
            elem: typing.Union[Tag, NavigableString]
    ) -> bool:
        return cls._is_standard_quote(elem) \
               or cls._is_thunderbird_quote(elem) \
               or cls._is_gmail_quote(elem) \
               or cls._is_outlook_com_quote(elem) \
               or cls._is_yahoo_quote(elem) \
               or cls._is_roundcube_quote(elem)

    @classmethod
    def _is_standard_quote(
            cls,
            elem: typing.Union[Tag, NavigableString]
    ) -> bool:
        if isinstance(elem, Tag) \
                and elem.name.lower() == 'blockquote':
            return True
        return False

    @classmethod
    def _is_thunderbird_quote(
            cls,
            elem: typing.Union[Tag, NavigableString]
    ) -> bool:
        return cls._has_attr_value(
            elem,
            'class',
            ProprietaryHTMLAttrValues.Thunderbird_quote_prefix_class)

    @classmethod
    def _is_gmail_quote(
            cls,
            elem: typing.Union[Tag, NavigableString]
    ) -> bool:
        if cls._has_attr_value(
                elem,
                'class',
                ProprietaryHTMLAttrValues.Gmail_extras_class):
            for child in elem.children:
                if cls._has_attr_value(
                        child,
                        'class',
                        ProprietaryHTMLAttrValues.Gmail_quote_class):
                    return True
        return False

    @classmethod
    def _is_outlook_com_quote(
        cls,
        elem: typing.Union[Tag, NavigableString]
    ) -> bool:
        if cls._has_attr_value(
                elem,
                'id',
                ProprietaryHTMLAttrValues.Outlook_com_quote_id):
            return True
        return False

    @classmethod
    def _is_yahoo_quote(
            cls,
            elem: typing.Union[Tag, NavigableString]
    ) -> bool:
        return cls._has_attr_value(
            elem,
            'class',
            ProprietaryHTMLAttrValues.Yahoo_quote_class)

    @classmethod
    def _is_roundcube_quote(
            cls,
            elem: typing.Union[Tag, NavigableString]
    ) -> bool:
        return cls._has_attr_value(
            elem,
            'id',
            ProprietaryHTMLAttrValues.Roundcube_quote_prefix_class)


class HtmlMailSignatureChecker(HtmlChecker):

    @classmethod
    def is_signature(
            cls,
            elem: typing.Union[Tag, NavigableString]
    ) -> bool:
        return cls._is_thunderbird_signature(elem) \
               or cls._is_gmail_signature(elem) \
               or cls._is_outlook_com_signature(elem)

    @classmethod
    def _is_thunderbird_signature(
            cls,
            elem: typing.Union[Tag, NavigableString]
    ) -> bool:
        return cls._has_attr_value(
            elem,
            'class',
            ProprietaryHTMLAttrValues.Thunderbird_signature_class)

    @classmethod
    def _is_gmail_signature(
            cls,
            elem: typing.Union[Tag, NavigableString]
    ) -> bool:
        if cls._has_attr_value(
                elem,
                'class',
                ProprietaryHTMLAttrValues.Gmail_signature_class):
            return True
        if cls._has_attr_value(
                elem,
                'class',
                ProprietaryHTMLAttrValues.Gmail_extras_class):
            for child in elem.children:
                if cls._has_attr_value(
                        child,
                        'class',
                        ProprietaryHTMLAttrValues.Gmail_signature_class):
                    return True
        if isinstance(elem, Tag) and elem.name.lower() == 'div':
            for child in elem.children:
                if cls._has_attr_value(
                        child,
                        'class',
                        ProprietaryHTMLAttrValues.Gmail_signature_class):
                    return True
        return False

    @classmethod
    def _is_outlook_com_signature(
            cls,
            elem: typing.Union[Tag, NavigableString]
    ) -> bool:
        if cls._has_attr_value(
                elem,
                'id',
                ProprietaryHTMLAttrValues.Outlook_com_signature_id):
            return True
        return False

